import { Profile } from "@/common/schemas";
import { ChatEvent, MUSIC_EVENTS, MusicEventMap } from "@/common/types";
import { TaskQueue } from "@/common/util";
import { ProviderService } from "@/services/shared";
import { IpcMain } from "electron";
import { ConnectionResponse, MusicProvider } from "./common";
import { Spotify, YouTubeMusic } from "./providers";

export class MusicService extends ProviderService<MusicProvider> {
  private _queue: TaskQueue;
  constructor() {
    super();
    this._queue = new TaskQueue();
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

  public async play(query: string) {
    if (!this._current?.provider) return;
    await this._current?.provider.searchAndQueue(query);
  }

  public async next() {
    if (!this._current?.provider) return;
    await this._current.provider.next();
  }

  public async previous() {
    if (!this._current?.provider) return;
    await this._current.provider.previous();
  }

  public stopPolling() {
    if (!this._current?.provider) return;
    this._current.provider.stopPolling();
  }

  public on<K extends MUSIC_EVENTS>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ): void {
    if (!this._current?.provider) return;
    this._current.provider.on(event, listener);
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

  public clearHandler() {
    this._queue.stop();
  }

  public handle(chat: ChatEvent, settings: Profile["music"]) {
    if (!this._valid(settings, chat)) return;
    const parsed = this._parseText(settings, chat);

    this._queue.setQueueOptions({
      gapTime: settings.protection.cooldown,
      maxQueueLength: settings.protection.queue_length,
    });

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
  }
}
