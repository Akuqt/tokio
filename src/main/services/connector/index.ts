import { Providers, TIKTOK_EVENTS, TikTokEventMap } from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import { Service } from "../shared";
import { ConnectorProvider, ConnectorResponse, GiftResponse } from "./common";
import { TikTokLiveConnector } from "./providers";

export class TikTokConnectorService extends Service {
  private _current: { name: string; provider: ConnectorProvider | null };
  private _providerPool: Map<string, ConnectorProvider>;

  constructor() {
    super();
    this._current = {
      name: "",
      provider: null,
    };
    this._providerPool = new Map<string, ConnectorProvider>();
    this.addProvider("TikTok", new TikTokLiveConnector(), true); // Note: Default Provider
  }

  private addProvider(
    name: string,
    provider: ConnectorProvider,
    start?: boolean,
  ) {
    if (!(provider instanceof ConnectorProvider)) return;
    this._providerPool.set(name, provider);
    if (start) {
      this.setProvider(name);
    }
  }

  public setProvider(name: string) {
    const provider = this._providerPool.get(name);
    if (!provider) return;
    this._current = { name, provider };
  }

  public getProvides(): Providers {
    const provides = this._providerPool.keys().toArray();
    return provides.map((s) => ({ name: s, active: s == this._current.name }));
  }

  public setKey(key: string): void {
    if (this._current.provider) this._current.provider.setKey(key);
  }

  public setLogFile(logFile: string): void {
    this._logFile = logFile;
  }

  public on<T extends TIKTOK_EVENTS>(
    event: T,
    listener: (data: TikTokEventMap[T]) => void,
  ): void {
    if (this._current.provider) this._current.provider.on(event, listener);
  }

  public async connect(
    username: string,
    key?: string,
  ): Promise<ConnectorResponse> {
    Logger.info(`<Connector> Connecting to: ${username}`, this._logFile);
    if (!this._current.provider) {
      Logger.error(`<Connector> No provider was defined.`, this._logFile);
      return {
        success: false,
        error: new Error("No conector provider was defined."),
      };
    }
    const res = await this._current.provider.connect(username, key);
    if (!res.success) {
      Logger.error(
        `<Connector> Unable to connecto to ${username} -- ${formatError(res.error)}`,
        this._logFile,
      );
    } else {
      Logger.error(`<Connector> Connected to ${username}.`, this._logFile);
    }
    return res;
  }

  public async disconnect(): Promise<void> {
    if (this._current.provider) this._current.provider.disconnect();
  }

  public isConnected(): boolean {
    if (!this._current.provider) return false;
    return this._current.provider.isConnected();
  }

  public async fetchGifts(): Promise<GiftResponse> {
    if (!this._current.provider)
      return { data: [], warn: "No conector provider was defined." };
    const res = await this._current.provider.fetchGifts();
    return res;
  }
}
