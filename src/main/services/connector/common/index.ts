import { Gift, TIKTOK_EVENTS, TikTokEventMap } from "@/common/types";

export type ConnectorResponse = { success: boolean; error?: Error };
export type GiftResponse = { data: Gift[]; error?: Error; warn?: string };

export abstract class ConnectorProvider {
  public abstract setKey(key: string): void;
  public abstract on<T extends TIKTOK_EVENTS>(
    event: T,
    listener: (data: TikTokEventMap[T]) => void,
  ): void;
  public abstract connect(
    username: string,
    key?: string,
  ): Promise<ConnectorResponse>;
  public abstract disconnect(): Promise<void>;
  public abstract isConnected(): boolean;
  public abstract fetchGifts(): Promise<GiftResponse>;
}
