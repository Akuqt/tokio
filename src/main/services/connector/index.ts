import {
  Gift,
  LoggerOptions,
  TIKTOK_EVENTS,
  TikTokEventMap,
} from "@/common/types";
import { TikTokConnectorService } from "../shared";
import { TikTokLiveConnector } from "./core";

type Services = { name: string; active: boolean }[];

export class TikTokConnectorServices extends TikTokConnectorService {
  private _current: { name: string; service: TikTokConnectorService | null };
  private _servicePool: Map<string, TikTokConnectorService>;

  constructor() {
    super();
    this._current = {
      name: "",
      service: null,
    };
    this._servicePool = new Map<string, TikTokConnectorService>();
    this.addService("TikTok", new TikTokLiveConnector(), true);
  }

  public addService(
    name: string,
    service: TikTokConnectorService,
    start?: boolean,
  ) {
    if (!(service instanceof TikTokConnectorService)) return;
    this._servicePool.set(name, service);
    if (start) {
      this.setService(name);
    }
  }

  public setService(name: string) {
    const service = this._servicePool.get(name);
    if (!service) return;
    this._current = { name, service };
  }

  public getServices(): Services {
    const services = this._servicePool.keys().toArray();
    return services.map((s) => ({ name: s, active: s == this._current.name }));
  }

  public setKey(key: string): void {
    if (this._current.service) this._current.service.setKey(key);
  }

  public setLogOptions(options: LoggerOptions): void {
    if (this._current.service) this._current.service.setLogOptions(options);
  }

  public on<T extends TIKTOK_EVENTS>(
    event: T,
    listener: (data: TikTokEventMap[T]) => void,
  ): void {
    if (this._current.service) this._current.service.on(event, listener);
  }

  public async connect(username: string, key?: string): Promise<void> {
    if (this._current.service) this._current.service.connect(username, key);
  }

  public async disconnect(): Promise<void> {
    if (this._current.service) this._current.service.disconnect();
  }

  public isConnected(): boolean {
    if (!this._current.service) return false;
    return this._current.service.isConnected();
  }

  public async fetchGifts(): Promise<Gift[]> {
    if (!this._current.service) return [];
    const res = await this._current.service.fetchGifts();
    return res;
  }
}
