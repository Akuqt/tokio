import { Provider, TIKTOK_EVENTS, TikTokEventMap } from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import { ProviderService } from "../shared";
import { ConnectorProvider, ConnectorResponse, GiftResponse } from "./common";
import { TikTokLiveConnector } from "./providers";

export class TikTokConnectorService extends ProviderService<ConnectorProvider> {
  constructor() {
    super();
    this._current = {
      name: "",
      provider: null,
      key: "",
    };
    this._providerPool = new Map();
    this.addProvider("Default", new TikTokLiveConnector(), true); // NOTE: DO NOT CHANGE, Add your providers below.
  }

  public addProvider(
    name: string,
    provider: ConnectorProvider,
    start?: boolean,
  ) {
    if (!(provider instanceof ConnectorProvider)) return;
    this._providerPool?.set(name, provider);
    if (start) {
      this.setProvider(name);
    }
  }

  public setProvider(name: string, key?: string) {
    const provider = this._providerPool?.get(name);
    if (!provider) return;
    this._current = { name, provider, key: key || "" };
    this.setKey(key || "");
  }

  public getProviders(): Provider[] {
    const providers = this._providerPool?.keys().toArray() || [];
    return providers.map((s) => ({
      name: s,
      active: s == this._current?.name,
      key: this._current?.key || "",
    }));
  }

  public getActiveProvider(): Provider {
    return {
      name: this._current?.name || "Default",
      active: true,
      key: this._current?.key || "",
    };
  }

  public setKey(key: string): void {
    if (this._current?.provider) this._current.provider.setKey(key);
  }

  public setLogFile(logFile: string): void {
    this._logFile = logFile;
  }

  public on<T extends TIKTOK_EVENTS>(
    event: T,
    listener: (data: TikTokEventMap[T]) => void,
  ): void {
    if (this._current?.provider) this._current.provider.on(event, listener);
  }

  public async connect(
    username: string,
    key?: string,
  ): Promise<ConnectorResponse> {
    Logger.info(`<Connector> Connecting to: ${username}`, this._logFile);
    if (!this._current?.provider) {
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
      Logger.success(`<Connector> Connected to ${username}.`, this._logFile);
    }
    return res;
  }

  public async disconnect(): Promise<void> {
    if (this._current?.provider) await this._current.provider.disconnect();
  }

  public isConnected(): boolean {
    if (!this._current?.provider) return false;
    return this._current.provider.isConnected();
  }

  public async fetchGifts(): Promise<GiftResponse> {
    if (!this._current?.provider)
      return { data: [], warn: "No conector provider was defined." };
    const res = await this._current.provider.fetchGifts();
    return res;
  }
}
