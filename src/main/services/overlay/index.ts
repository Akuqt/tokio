import { OverlayConfig, OverlayConfigSchema } from "@/common/schemas";
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

// The parts of the store that keep the overlay list.
type OverlayStore = Pick<
  StoreManagerService,
  "wasRebuilt" | "getSettings" | "addOverlayInfo" | "removeOverlayInfo"
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
      const dir = this._dir(overlay.id);
      const res = await processOverlay(dir, this._yaml, overlay.external!);
      const html =
        res.success &&
        (await processHTML(
          overlay.id,
          res.data!.htmlContent,
          dir,
          "value",
          res.data!.config,
          gifts,
        ));

      if (!html || !html.success) {
        Logger.warn(
          `<Overlays> Unable to load overlay ${overlay.id}, it has been removed.`,
          this._logFile,
        );
        await this._store.removeOverlayInfo(overlay.id);
        continue;
      }

      this._register({ ...res.data!.info, id: overlay.id, path: dir }, false);
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

  private _register(overlay: OverlayApp, rebuild: boolean): void {
    this._overlays.push(overlay);
    this._server.mount(overlay.id, overlay.path, rebuild);
  }

  private _dir(id: string): string {
    return join(this._folder, id);
  }
}
