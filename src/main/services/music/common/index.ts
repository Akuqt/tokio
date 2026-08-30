import { MUSIC_EVENTS, MusicEventMap } from "@/common/types";
import type { BrowserWindow } from "electron";

export type ConnectionResponse = { success: boolean; error?: Error };

export abstract class MusicProvider {
  public abstract setKey(key: string): void;
  public abstract connect(win: BrowserWindow): Promise<ConnectionResponse>;
  public abstract disconnect(): void;
  public abstract play(contextUri?: string): Promise<void>;
  public abstract pause(): Promise<void>;
  public abstract next(): Promise<void>;
  public abstract previous(): Promise<void>;
  public abstract searchAndQueue(query: string): Promise<void>;
  public abstract stopPolling(): void;
  public abstract isActive(): boolean;
  public abstract on<K extends MUSIC_EVENTS>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ): void;
}
