export type GenerationResponse = {
  success: boolean;
  buffer?: Buffer<ArrayBuffer>;
};

export type VoiceData = {
  name: string;
  lang: string;
}[];

export abstract class TTSService {
  abstract setKey(session: string): void;
  abstract getVoices(): VoiceData;
  abstract generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse>;
}
