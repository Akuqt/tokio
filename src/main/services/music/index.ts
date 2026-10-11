import { Profile } from "@/common/schemas";
import { ChatEvent, TOKIO_EVENTS, TokioEventMap } from "@/common/types";
import { TaskQueue } from "@/common/util";
import { ProviderService } from "@/services/shared";
import { IpcMain } from "electron";
import { ConnectionResponse, MusicProvider, MusicQueue } from "./common";
import { Spotify, YouTubeMusic } from "./providers";

export class MusicService extends ProviderService<MusicProvider> {
  private _queue: TaskQueue;
  private _music_queue: MusicQueue;
  constructor() {
    super();
    this._queue = new TaskQueue();
    this._music_queue = new MusicQueue();
    this.addProvider("YouTube", new YouTubeMusic(), true);
    this.addProvider("Spotify", new Spotify());
  }

  protected override _validProvider(provider: MusicProvider): boolean {
    return provider instanceof MusicProvider;
  }

  public connect(ipcMain: IpcMain): Promise<ConnectionResponse> {
    if (!this._current?.provider)
      return new Promise((r) =>
        r({
          success: false,
          error: new Error("Music Provider not defined."),
        }),
      );

    return this._current.provider.connect(ipcMain);
  }

  public disconnect() {
    if (!this._current?.provider) return;
    this._current.provider.disconnect();
  }

  public isActive() {
    if (!this._current?.provider) return false;
    return this._current.provider.isActive();
  }

  public on<K extends TOKIO_EVENTS>(
    event: K,
    listener: (data: TokioEventMap[K]) => void,
  ): void {
    if (!this._current?.provider) return;
    this._current.provider.on(event, listener);
    this._music_queue.on(event, listener);
  }

  public clearHandler() {
    this._queue.stop();
    this._music_queue.clear();
  }

  public handle(chat: ChatEvent, settings: Profile["music"]) {
    if (!this._valid(settings, chat)) return;
    const parsed = this._parseText(settings, chat);

    this._queue.setQueueOptions({
      gapTime: settings.protection.cooldown,
      maxQueueLength: settings.protection.queue_length,
    });

    this._music_queue.setMaxSize(settings.protection.queue_length);

    if (parsed.command === settings.constrols.play.command) {
      this._queue.enqueue(async () => {
        this.play(parsed.args);
      });
    }
    if (parsed.command === settings.constrols.next.command) {
      this._queue.enqueue(async () => {
        this.next();
      });
    }
    if (parsed.command === settings.constrols.last.command) {
      this._queue.enqueue(async () => {
        this.previous();
      });
    }
    if (parsed.command === settings.constrols.revoke.command) {
      this._queue.enqueue(async () => {
        this.revoke(parsed.args);
      });
    }
  }

  private async play(query: string) {
    if (!this._current?.provider) return;

    if (!this._music_queue.getQueueState().isPlaying) {
      const current = await this._current.provider.playerStatus();
      if (current && current.playing) {
        this._music_queue.addCurrentlyPlaying(
          current.title,
          current,
          current.time,
        );
      }
    }

    const info = await this._current?.provider.searchSong(query);

    if (info === null) return;

    this._music_queue.enqueue(query, info, () => {
      this._current?.provider?.play(info);
    });
  }

  private async next() {
    if (!this._current?.provider) return;
    await this._music_queue.triggerNext();
  }

  private async previous() {
    if (!this._current?.provider) return;
    await this._music_queue.triggerPrevious();
  }

  private async revoke(query: string) {
    if (!this._current?.provider) return;
    this._music_queue.revoke(query);
  }

  private _parseText(settings: Profile["music"], chat: ChatEvent) {
    const matchedControl = Object.values(settings.constrols).find((c) =>
      chat.comment.content.startsWith(c.command),
    );

    const command = matchedControl!.command;

    const args = chat.comment.content.slice(command.length).trim();

    return {
      command,
      args,
    };
  }

  private _valid(settings: Profile["music"], chat: ChatEvent) {
    if (chat.comment.content === "") return false;

    const matchedControl = Object.values(settings.constrols).find((c) =>
      chat.comment.content.startsWith(c.command),
    );

    if (!matchedControl || !matchedControl.enabled) {
      return false;
    }

    if (settings.permissions.all) return true;

    if (settings.permissions.list.enabled) {
      const handle = chat.user.handle;
      const { black, white } = settings.permissions.list;

      return (
        !black.includes(handle) &&
        (white.length === 0 || white.includes(handle))
      );
    }

    const passedRoles: boolean[] = [];

    if (settings.permissions.followers) {
      passedRoles.push(chat.user.follower ?? false);
    }
    if (settings.permissions.moderators) {
      passedRoles.push(chat.user.moderator ?? false);
    }
    if (settings.permissions.superfans) {
      passedRoles.push(chat.user.superfan ?? false);
    }
    if (settings.permissions.level.enabled) {
      passedRoles.push(
        (chat.user.fanLevel ?? 0) >= settings.permissions.level.value,
      );
    }

    if (passedRoles.length > 0) {
      return passedRoles.some((passed) => passed === true);
    }

    return true;
  }
}
