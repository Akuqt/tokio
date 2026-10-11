import { TOKIO_EVENTS, TokioEventMap } from "@/common/types";
import { formatError } from "@/common/util";
import Logger from "@/logger";
import { ProviderService } from "../shared";
import { ConnectorProvider, ConnectorResponse, GiftResponse } from "./common";
import { TikTokLiveConnector } from "./providers";

export class TikTokConnectorService extends ProviderService<ConnectorProvider> {
  constructor() {
    super();
    this.addProvider("Default", new TikTokLiveConnector(), true); // NOTE: DO NOT CHANGE, Add your providers below.
  }

  protected override _validProvider(provider: ConnectorProvider): boolean {
    return provider instanceof ConnectorProvider;
  }

  public on<T extends TOKIO_EVENTS>(
    event: T,
    listener: (data: TokioEventMap[T]) => void,
  ): void {
    if (this._current?.provider) this._current.provider.on(event, listener);
  }

  public off<T extends TOKIO_EVENTS>(
    event: T,
    listener: (data: TokioEventMap[T]) => void,
  ): void {
    if (this._current?.provider) this._current.provider.off(event, listener);
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
      return {
        success: false,
        data: [],
        warn: "No conector provider was defined.",
      };
    const res = await this._current.provider.fetchGifts();
    return res;
  }
}
