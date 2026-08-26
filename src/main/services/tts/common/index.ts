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
  public abstract getVoices(): VoiceData[];
  public abstract generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse>;
}
