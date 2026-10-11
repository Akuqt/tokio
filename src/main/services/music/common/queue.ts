import { MUSIC_EVENTS, MusicEventMap, SongInfo } from "@/common/types";
import EventEmitter from "node:events";

type PlayAction = () => void | Promise<void>;

interface QueueItem {
  id: string;
  song: SongInfo;
  action: PlayAction;
  startTimeMs?: number;
}

const delayWithAbort = (ms: number, signal?: AbortSignal) => {
  return new Promise<void>((resolve) => {
    if (signal?.aborted) return resolve();

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
};

export class MusicQueue {
  private _queue: QueueItem[];
  private _currentIndex: number;
  private _isPlaying: boolean;
  private _abortController: AbortController | null;
  private _events: EventEmitter;
  private _maxSize: number;

  constructor(maxSize: number = Infinity) {
    this._queue = [];
    this._currentIndex = 0;
    this._isPlaying = false;
    this._abortController = null;
    this._events = new EventEmitter();
    this._maxSize = maxSize;
  }

  /**
   * Configures the maximum size of the queue dynamically.
   * If the queue is already larger than the new size, it will immediately trim it.
   */
  public setMaxSize(size: number) {
    this._maxSize = Math.max(1, size); // Ensure size is at least 1
    this._trimQueue();
  }

  public getMaxSize(): number {
    return this._maxSize;
  }

  public on<K extends MUSIC_EVENTS>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ): void {
    this._events.on(event, listener);
  }

  private emit<K extends MUSIC_EVENTS>(
    event: K,
    data?: MusicEventMap[K],
  ): void {
    this._events.emit(event, data);
  }

  /**
   * Enforces the maximum queue size by removing history first.
   * If there is no history, it removes from the end of the queue.
   */
  private _trimQueue() {
    while (this._queue.length > this._maxSize) {
      if (this._currentIndex > 0) {
        this._queue.shift();
        this._currentIndex--;
      } else {
        this._queue.pop();
      }
    }
  }

  public enqueue(id: string, song: SongInfo, action: PlayAction) {
    this._queue.push({ id, song, action });
    this._trimQueue();
    this.play();
  }

  public addCurrentlyPlaying(
    id: string,
    song: SongInfo,
    currentTimeMs: number,
  ) {
    this._queue.push({
      id,
      song,
      action: () => {},
      startTimeMs: currentTimeMs,
    });
    this._trimQueue();
    this.play();
  }

  public play() {
    if (!this._isPlaying && this._currentIndex < this._queue.length) {
      this.processQueue();
    }
  }

  public pause() {
    this._isPlaying = false;
    this._abortController?.abort();
  }

  public clear() {
    this.pause();
    this._queue = [];
    this._currentIndex = 0;
  }

  public revoke(id: string) {
    const index = this._queue.findIndex((item) => item.id === id);
    if (index === -1) return;

    this._queue.splice(index, 1);

    if (index < this._currentIndex) {
      this._currentIndex--;
    } else if (index === this._currentIndex) {
      this.pause();
      if (this._queue.length > 0) {
        this.play();
      }
    }
  }

  public async triggerNext() {
    if (this._currentIndex < this._queue.length - 1) {
      this.pause();
      this._currentIndex++;

      await Promise.resolve();
      this.play();
    }
  }

  public async triggerPrevious() {
    if (this._currentIndex > 0) {
      this.pause();
      this._currentIndex--;

      await Promise.resolve();
      this.play();
    }
  }

  public async triggerAt(index: number) {
    if (index >= 0 && index < this._queue.length) {
      this.pause();
      this._currentIndex = index;

      await Promise.resolve();
      this.play();
    }
  }

  public triggerById(id: string) {
    const index = this._queue.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.triggerAt(index);
    }
  }

  public getQueueState() {
    return {
      queue: [...this._queue],
      currentIndex: this._currentIndex,
      currentSong: this._queue[this._currentIndex]?.song,
      isPlaying: this._isPlaying,
      maxSize: this._maxSize,
    };
  }

  private async processQueue() {
    this._isPlaying = true;
    this._abortController = new AbortController();

    while (this._currentIndex < this._queue.length && this._isPlaying) {
      const item = this._queue[this._currentIndex];

      this.emit(MUSIC_EVENTS.TRACK_CHANGE, item.song);

      try {
        await item.action();
      } catch (error) {
        console.error(`MusicQueue: Error playing track [${item.id}]`, error);
      }

      const waitTime =
        item.startTimeMs !== undefined
          ? Math.max(0, item.song.duration - item.startTimeMs)
          : item.song.duration;

      item.startTimeMs = undefined;

      if (this._isPlaying && waitTime > 0) {
        await delayWithAbort(waitTime, this._abortController.signal);
      }

      if (!this._isPlaying) break;

      this._currentIndex++;
    }

    this._isPlaying = false;
  }
}
