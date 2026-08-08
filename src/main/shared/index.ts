import {
  Gift,
  LoggerOptions,
  TIKTOK_EVENTS,
  TikTokEventMap,
} from "@/common/types";

export type GenerationResponse = {
  success: boolean;
  buffer?: Buffer<ArrayBuffer>;
};

export type VoiceData = {
  name: string;
  lang: string;
}[];

export abstract class TTSService {
  public abstract setKey(key: string): void;
  public abstract getVoices(): VoiceData;
  public abstract generateBuffer(
    text: string,
    lang?: string,
    voice?: string,
  ): Promise<GenerationResponse>;
}

export abstract class TikTokConnectorService {
  public abstract setKey(key: string): void;
  public abstract setLogOptions(options: LoggerOptions): void;
  public abstract on<T extends TIKTOK_EVENTS>(
    event: T,
    listener: (data: TikTokEventMap[T]) => void,
  ): void;
  public abstract connect(username: string, key?: string): Promise<void>;
  public abstract disconnect(): Promise<void>;
  public abstract isConnected(): boolean;
  public abstract fetchGifts(): Promise<Gift[]>;
}
