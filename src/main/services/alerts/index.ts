import { Alert, Profile } from "@/common/schemas";
import {
  AppEvents,
  MyInstantsSound,
  TOKIO_EVENTS,
  TokioEventMap,
} from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";
import { access, readFile, unlink, writeFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { Service } from "../shared";

export interface AlertsResult<T> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface MyInstantsPage {
  sounds: MyInstantsSound[];
  hasNextPage: boolean;
}

export interface AlertAudio {
  data: Uint8Array;
  volume: number;
  channel: string;
  maxQueueLength: number;
  id?: string;
}

export const AUDIO_EXTENSIONS = ["mp3", "wav", "ogg"];

// Number of sounds kept in memory
const CACHE_SIZE = 30;

const hash = (data: string | Uint8Array) =>
  createHash("sha256").update(data).digest("hex").slice(0, 32);

export class AlertsService extends Service {
  private readonly BASE_URL = "https://www.myinstants.com";
  private readonly MAX_PER_PAGE = 36;
  private _soundsFolder = "";
  // Keyed by sound file name, in least recently used order
  private _cache = new Map<string, Uint8Array>();

  public setLogFile(logFile: string): void {
    this._logFile = logFile;
  }

  public setSoundsFolder(folder: string): void {
    this._soundsFolder = folder;
  }

  /**
   * Gets trending/latest sounds from the homepage.
   */
  public async getTrending(
    page: number = 1,
  ): Promise<AlertsResult<MyInstantsPage>> {
    const url = new URL(this.BASE_URL);
    if (page > 1) url.searchParams.append("page", page.toString());
    return this._fetchPage(url, page);
  }

  /**
   * Searches MyInstants for sounds matching the query.
   */
  public async search(
    query: string,
    page: number = 1,
  ): Promise<AlertsResult<MyInstantsPage>> {
    const url = new URL(`${this.BASE_URL}/search/`);
    url.searchParams.append("name", query);
    url.searchParams.append("page", page.toString());
    return this._fetchPage(url, page);
  }

  /**
   * Gets a MyInstants sound without saving it, e.g. for previews.
   * Uses memory or the downloaded file before going to the network.
   */
  public async fetchSound(url: string): Promise<AlertsResult<Uint8Array>> {
    try {
      if (!this._isMyInstantsUrl(url)) {
        throw new Error(`Refusing to fetch non MyInstants url: ${url}`);
      }

      const file = this._fileForUrl(url);
      const local = await this.readSound(file, false);
      if (local.success) return local;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`MyInstants responded with status: ${response.status}`);
      }
      const data = new Uint8Array(await response.arrayBuffer());
      this._remember(file, data);
      return { success: true, data };
    } catch (error) {
      return this._fail("Unable to fetch sound", error);
    }
  }

  /**
   * Downloads a MyInstants sound into the sounds folder.
   * A sound is only written once, however many alerts use it.
   */
  public async downloadSound(
    url: string,
    name: string,
  ): Promise<AlertsResult<NonNullable<Alert["sound"]>>> {
    const file = this._fileForUrl(url);
    if (await this._isSaved(file)) {
      return { success: true, data: { name, file } };
    }

    const res = await this.fetchSound(url);
    if (!res.success || !res.data) return { success: false, error: res.error };

    try {
      await writeFile(join(this._soundsFolder, file), res.data);
      return { success: true, data: { name, file } };
    } catch (error) {
      return this._fail("Unable to save sound", error);
    }
  }

  /**
   * Copies a local audio file into the sounds folder.
   */
  public async importSound(
    srcPath: string,
  ): Promise<AlertsResult<NonNullable<Alert["sound"]>>> {
    try {
      const ext = extname(srcPath).slice(1).toLowerCase();
      if (!AUDIO_EXTENSIONS.includes(ext)) {
        throw new Error(`Unsupported audio format: ${ext}`);
      }
      // Named by content, so importing the same file twice reuses it.
      const data = new Uint8Array(await readFile(srcPath));
      const file = `${hash(data)}.${ext}`;
      if (!(await this._isSaved(file))) {
        await writeFile(join(this._soundsFolder, file), data);
      }
      this._remember(file, data);
      return {
        success: true,
        data: { name: basename(srcPath, extname(srcPath)), file },
      };
    } catch (error) {
      return this._fail("Unable to import sound", error);
    }
  }

  public async deleteSound(file: string): Promise<AlertsResult<void>> {
    const name = basename(file);
    this._cache.delete(name);
    try {
      await unlink(join(this._soundsFolder, name));
      return { success: true };
    } catch (error) {
      return this._fail("Unable to delete sound", error);
    }
  }

  public async readSound(
    file: string,
    logMissing: boolean = true,
  ): Promise<AlertsResult<Uint8Array>> {
    // basename keeps a stored value from pointing outside the sounds folder
    const name = basename(file);
    const cached = this._cache.get(name);
    if (cached) {
      this._remember(name, cached);
      return { success: true, data: cached };
    }

    try {
      const data = new Uint8Array(
        await readFile(join(this._soundsFolder, name)),
      );
      this._remember(name, data);
      return { success: true, data };
    } catch (error) {
      if (!logMissing) return { success: false, error: formatError(error) };
      return this._fail("Unable to read sound", error);
    }
  }

  /**
   * Plays every enabled alert that matches the live event.
   */
  public async handle<K extends AppEvents>(
    type: K,
    payload: TokioEventMap[K],
    settings: Profile["alerts"],
    send: (audio: AlertAudio) => void,
  ) {
    const channel = settings.simultaneous ? `alerts:${type}` : "alerts";

    for (const alert of settings.items) {
      if (!this._matches(alert, type, payload) || !alert.sound) continue;

      const res = await this.readSound(alert.sound.file);
      if (!res.success || !res.data) continue;

      send({
        data: res.data,
        volume: alert.volume,
        channel,
        maxQueueLength: settings.queue_length,
        id: alert.id,
      });
    }
  }

  private _matches(
    alert: Alert,
    type: AppEvents,
    payload: TokioEventMap[AppEvents],
  ) {
    if (!alert.enabled || !alert.sound || alert.trigger.type !== type) {
      return false;
    }

    if (
      type === TOKIO_EVENTS.GIFT &&
      typeof payload === "object" &&
      payload !== null &&
      "gift" in payload
    ) {
      const { gift } = payload;
      // Fire once per combo, not on every combo tick.
      if (!gift.repeatEnd) return false;
      const gifts = alert.trigger.gifts;
      return gifts.length === 0 || gifts.includes(Number(gift.id));
    }

    return true;
  }

  private async _fetchPage(
    url: URL,
    page: number,
  ): Promise<AlertsResult<MyInstantsPage>> {
    try {
      if (page < 1) throw new Error("Page must be a positive integer.");

      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 404) {
          return { success: true, data: { sounds: [], hasNextPage: false } };
        }
        throw new Error(`MyInstants responded with status: ${response.status}`);
      }

      const parsed = this._parseSoundsFromHtml(await response.text());
      const sounds = await Promise.all(
        parsed.map(async (sound) => ({
          ...sound,
          saved: await this._isSaved(this._fileForUrl(sound.url)),
        })),
      );

      return {
        success: true,
        data: { sounds, hasNextPage: sounds.length === this.MAX_PER_PAGE },
      };
    } catch (error) {
      return this._fail("Unable to fetch MyInstants page", error);
    }
  }

  /**
   * Parses the HTML to extract sound buttons.
   */
  private _parseSoundsFromHtml(html: string): MyInstantsSound[] {
    const $ = cheerio.load(html);
    const sounds: MyInstantsSound[] = [];

    $("#instants_container > div.instants.result-page > .instant").each(
      (_, element) => {
        const name = $(element).find("a.instant-link").text().trim();
        const playScript = $(element)
          .find("button.small-button")
          .attr("onclick");

        const match = playScript?.match(/play\('([^']+)'/);
        if (name && match?.[1]) {
          sounds.push({
            name,
            url: `${this.BASE_URL}${match[1]}`,
            saved: false,
          });
        }
      },
    );

    return sounds;
  }

  private _fileForUrl(url: string) {
    return `${hash(url)}.mp3`;
  }

  private async _isSaved(file: string) {
    try {
      await access(join(this._soundsFolder, file));
      return true;
    } catch {
      return false;
    }
  }

  private _remember(file: string, data: Uint8Array) {
    this._cache.delete(file);
    this._cache.set(file, data);
    if (this._cache.size > CACHE_SIZE) {
      const oldest = this._cache.keys().next().value;
      if (oldest !== undefined) this._cache.delete(oldest);
    }
  }

  private _isMyInstantsUrl(url: string) {
    try {
      return new URL(url).origin === this.BASE_URL;
    } catch {
      return false;
    }
  }

  private _fail(action: string, error: unknown) {
    const message = formatError(error);
    Logger.error(`<Alerts> ${action} -- ${message}`, this._logFile, error);
    return { success: false, error: message };
  }
}
