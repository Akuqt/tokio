import {
  OverlayConfig,
  OverlayConfigSchema,
  OverlayMetadata,
  TestOverlay,
} from "@/common/schemas";
import {
  AppEvents,
  CustomGift,
  OverlayApp,
  OverlayConfigRedux,
  TOKIO_EVENTS,
  TokioPayload,
} from "@/common/types";
import { formatError, generateTikTokEventSample } from "@/common/util";
import Logger from "@/logger";
import { randomUUID } from "node:crypto";
import { cp, rm } from "node:fs/promises";
import { join } from "node:path";
import { JSONManagerService } from "../json";
import { ServerService } from "../server";
import { Service } from "../shared";
import { StoreManagerService } from "../store";
import { YAMLManagerService } from "../yaml";
import { findOverlays, processHTML, processOverlay } from "./common";

// The parts of the store that keep the overlay lists.
type OverlayStore = Pick<
  StoreManagerService,
  | "wasRebuilt"
  | "getSettings"
  | "addOverlayInfo"
  | "removeOverlayInfo"
  | "addTestOverlay"
  | "removeTestOverlay"
>;

export interface OverlayResult<T = undefined> {
  success: boolean;
  data?: T;
}

// Internal events have no samples, overlays only get tested with live ones.
const INTERNAL_EVENTS: TOKIO_EVENTS[] = [
  TOKIO_EVENTS.CONNECTED,
  TOKIO_EVENTS.DISCONNECTED,
  TOKIO_EVENTS.MUSIC_PROCCESS_ENDED,
];

const isLiveEvent = (event: TOKIO_EVENTS): event is AppEvents =>
  !INTERNAL_EVENTS.includes(event);

export class OverlayService extends Service {
  private _folder = "";
  private _giftsFile = "";
  private _overlays: OverlayApp[] = [];
  private _yaml: YAMLManagerService;
  private _json: JSONManagerService;
  private _server: ServerService;
  private _store: OverlayStore;

  public setLogFile(logFile: string): void {
    this._logFile = logFile;
  }

  public initialize(
    paths: { folder: string; giftsFile: string },
    services: {
      yaml: YAMLManagerService;
      json: JSONManagerService;
      server: ServerService;
      store: OverlayStore;
    },
  ): void {
    this._folder = paths.folder;
    this._giftsFile = paths.giftsFile;
    this._yaml = services.yaml;
    this._json = services.json;
    this._server = services.server;
    this._store = services.store;
  }

  /**
   * Saves the gifts, then checks every installed overlay, writes its saved
   * config into its HTML and serves it. Overlays that fail are forgotten.
   */
  public async load(gifts: CustomGift[]): Promise<void> {
    if (this._store.wasRebuilt()) {
      for (const overlay of await findOverlays(this._folder, this._yaml)) {
        await this._store.addOverlayInfo(overlay);
      }
    }

    await this._json.saveArbitraryFile(this._giftsFile, gifts);

    for (const overlay of this._store.getSettings().overlays) {
      const info = await this._writeHTML(overlay.id, overlay.external!, gifts);

      if (!info) {
        Logger.warn(
          `<Overlays> Unable to load overlay ${overlay.id}, it has been removed.`,
          this._logFile,
        );
        await this._store.removeOverlayInfo(overlay.id);
        continue;
      }

      this._register(
        { ...info, id: overlay.id, path: this._dir(overlay.id) },
        false,
      );
    }
  }

  /**
   * Saves gifts fetched after `load` and writes them into the loaded overlays.
   * Does nothing when they match the saved ones.
   */
  public async refreshGifts(gifts: CustomGift[]): Promise<void> {
    if (JSON.stringify(gifts) === JSON.stringify(await this.getGifts())) return;

    await this._json.saveArbitraryFile(this._giftsFile, gifts);

    const loaded = new Set(this._overlays.map((o) => o.id));
    for (const overlay of this._store.getSettings().overlays) {
      if (!loaded.has(overlay.id)) continue;
      if (!(await this._writeHTML(overlay.id, overlay.external!, gifts))) {
        Logger.warn(
          `<Overlays> Unable to update the gifts of overlay ${overlay.id}.`,
          this._logFile,
        );
      }
    }
  }

  /**
   * Copies the overlay in `basedir` into the overlays folder, with its config
   * defaults written into its HTML.
   */
  public async import(
    basedir: string,
    gifts: CustomGift[],
  ): Promise<OverlayResult> {
    const id = randomUUID();
    const dir = this._dir(id);
    try {
      const res = await processOverlay(basedir, this._yaml, true);
      if (!res.success) return { success: false };

      const { config, htmlContent, info } = res.data!;

      await cp(basedir, dir, { recursive: true });

      const html = await processHTML(
        id,
        htmlContent,
        dir,
        "default",
        config,
        gifts,
      );
      if (!html.success) {
        await rm(dir, { recursive: true, force: true });
        return { success: false };
      }

      this._register({ ...info, id, path: dir }, true);
      await this._store.addOverlayInfo({ ...info, id });

      return { success: true };
    } catch (error) {
      Logger.error(
        `<Overlays> Unable to import overlay from ${basedir} -- ${formatError(error)}`,
        this._logFile,
        error,
      );
      await rm(dir, { recursive: true, force: true }).catch(() => {});
      return { success: false };
    }
  }

  /**
   * Deletes an imported overlay with its settings and stops serving it.
   * Official overlays aren't removed here.
   */
  public async remove(id: string): Promise<OverlayResult> {
    // Only stored ids, so the renderer's id can't point outside the folder
    const overlay = this._store.getSettings().overlays.find((o) => o.id === id);
    if (!overlay?.external) {
      Logger.warn(
        `<Overlays> Unable to remove overlay ${id}, it isn't an imported overlay.`,
        this._logFile,
      );
      return { success: false };
    }

    try {
      await rm(this._dir(id), { recursive: true, force: true });
    } catch (error) {
      Logger.error(
        `<Overlays> Unable to remove overlay ${id} -- ${formatError(error)}`,
        this._logFile,
        error,
      );
      return { success: false };
    }

    this._server.unmount(id);
    this._overlays = this._overlays.filter((o) => o.id !== id);
    await this._store.removeOverlayInfo(id);
    return { success: true };
  }

  // Paths point at the overlay's HTML file.
  public getOverlays(): OverlayApp[] {
    return this._overlays.map((ov) => ({
      ...ov,
      path: join(ov.path, "index.html"),
    }));
  }

  public async getConfig(
    id: string,
  ): Promise<OverlayResult<OverlayConfig | undefined>> {
    const res = await processOverlay(this._dir(id), this._yaml, false);
    return { success: res.success, data: res.data?.config };
  }

  /**
   * Writes the config values into the overlay's HTML and saves the config.
   */
  public async saveConfig(
    id: string,
    config: OverlayConfig,
    gifts: CustomGift[],
  ): Promise<OverlayResult<OverlayConfigRedux>> {
    try {
      const dir = this._dir(id);
      const res = await processOverlay(dir, this._yaml, false);
      if (!res.success) return { success: false };

      const html = await processHTML(
        id,
        res.data!.htmlContent,
        dir,
        "value",
        config,
        gifts,
      );
      if (!html.success) return { success: false };

      const saved = await this._yaml.saveFile(
        res.paths!.config,
        OverlayConfigSchema,
        config,
      );
      if (!saved) return { success: false };

      return { success: true, data: html.parsed };
    } catch (error) {
      Logger.error(
        `<Overlays> Unable to save the config of overlay ${id} -- ${formatError(error)}`,
        this._logFile,
        error,
      );
      return { success: false };
    }
  }

  public async getGifts(): Promise<CustomGift[]> {
    const gifts = await this._json.loadArbitraryFile<CustomGift[]>(
      this._giftsFile,
    );
    return gifts ?? [];
  }

  public send(id: string, payload: TokioPayload): void {
    this._server.sendToClient(id, payload);
  }

  // A sample of every live event, for an overlay's test button.
  public getTestPayloads(): TokioPayload[] {
    return Object.values(TOKIO_EVENTS)
      .filter(isLiveEvent)
      .map((key) => generateTikTokEventSample(key));
  }

  // IDs for overlays tested without importing them, see the Tools page.
  public getTestOverlays(): TestOverlay[] {
    return this._store.getSettings().testOverlays;
  }

  public async createTestOverlay(
    name: string,
  ): Promise<OverlayResult<TestOverlay[]>> {
    const trimmed = name.trim();
    if (!trimmed) return { success: false };

    await this._store.addTestOverlay({ id: randomUUID(), name: trimmed });
    return { success: true, data: this.getTestOverlays() };
  }

  public async removeTestOverlay(
    id: string,
  ): Promise<OverlayResult<TestOverlay[]>> {
    await this._store.removeTestOverlay(id);
    return { success: true, data: this.getTestOverlays() };
  }

  /**
   * Sends every test payload to the overlay connected with `id`. Fails when
   * no overlay is connected with it.
   */
  public sendTestEvents(id: string): OverlayResult {
    const payloads = this.getTestPayloads();
    const sent = payloads.every((payload) =>
      this._server.sendToClient(id, payload),
    );
    if (!sent) {
      Logger.info(
        `<Overlays> No overlay connected with id ${id} to send test events to.`,
        this._logFile,
      );
    }
    return { success: sent };
  }

  // Writes the overlay's saved config and the gifts into its HTML.
  private async _writeHTML(
    id: string,
    external: boolean,
    gifts: CustomGift[],
  ): Promise<OverlayMetadata | null> {
    const dir = this._dir(id);
    const res = await processOverlay(dir, this._yaml, external);
    if (!res.success) return null;

    const html = await processHTML(
      id,
      res.data!.htmlContent,
      dir,
      "value",
      res.data!.config,
      gifts,
    );
    return html.success ? res.data!.info : null;
  }

  private _register(overlay: OverlayApp, rebuild: boolean): void {
    this._overlays.push(overlay);
    this._server.mount(overlay.id, overlay.path, rebuild);
  }

  private _dir(id: string): string {
    return join(this._folder, id);
  }
}
