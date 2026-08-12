import { Provider } from "@/common/types";
import { ProviderService } from "../shared";
import { GenerationResponse, TTSProvider, VoiceData } from "./common";
import { TikTokTTS } from "./providers";

export class TTSService extends ProviderService<TTSProvider> {
  constructor() {
    super();
    this._current = {
      name: "",
      provider: null,
    };
    this._providerPool = new Map();
    this.addProvider("TikTok", new TikTokTTS(), true); // NOTE: DO NOT CHANGE, Add your providers below.
  }

  public addProvider(name: string, provider: TTSProvider, start?: boolean) {
    if (!(provider instanceof TTSProvider)) return;
    this._providerPool?.set(name, provider);
    if (start) {
      this.setProvider(name);
    }
  }

  public setLogFile(logFile: string): void {
    this._logFile = logFile;
  }

  public setProvider(name: string, key?: string) {
    const provider = this._providerPool?.get(name);
    if (!provider) return;
    this._current = { name, provider };
    this.setKey(key || "");
  }

  public getProviders(): Provider[] {
    const providers = this._providerPool?.keys().toArray() || [];
    return providers.map((s) => ({
      name: s,
      active: s == this._current?.name,
    }));
  }

  public getVoices(): VoiceData[] {
    if (!this._current?.provider) return [];
    return this._current.provider.getVoices();
  }

  public setKey(key: string): void {
    if (this._current?.provider) this._current.provider.setKey(key);
  }

  public async generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse> {
    if (!this._current?.provider) return { success: false };
    const res = await this._current.provider.generateBuffer(text, lang, voice);
    return res;
  }
}
