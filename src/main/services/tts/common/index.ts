export type GenerationResponse = {
  success: boolean;
  buffer?: Buffer<ArrayBuffer>;
  error?: Error;
};

export type VoiceData = {
  name: string;
  lang: string;
};

export abstract class TTSProvider {
  public abstract setKey(key: string): void;
  public abstract getVoices(): VoiceData[] | Promise<VoiceData[]>;
  public abstract getDefaultVoice():
    VoiceData | null | Promise<VoiceData | null>;
  public abstract generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse>;
  // Release any resources (e.g. child processes) held by the provider.
  public dispose(): void {}
}
