import { GenerationResponse, TTSService, VoiceData } from "@/shared";
import { TikTokTTS } from "./tiktok/core";

type Services = { name: string; active: boolean }[];

export class TTSServices extends TTSService {
  private _current: { name: string; service: TTSService | null };
  private _servicePool: Map<string, TTSService>;

  constructor() {
    super();
    this._current = {
      name: "",
      service: null,
    };
    this._servicePool = new Map<string, TTSService>();
    this.addService("TikTok", new TikTokTTS(), true);
  }

  public addService(name: string, service: TTSService, start?: boolean) {
    if (!(service instanceof TTSService)) return;
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

  public getVoices(): VoiceData {
    if (this._current.service) return this._current.service.getVoices();
    return [];
  }

  public setKey(key: string): void {
    if (this._current.service) this._current.service.setKey(key);
  }

  public async generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse> {
    if (!this._current.service) return { success: false };
    const res = await this._current.service.generateBuffer(text, lang, voice);
    return res;
  }
}
