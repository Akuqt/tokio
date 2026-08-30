import { MUSIC_EVENTS, MusicEventMap } from "@/common/types";
import { ProviderService } from "@/services/shared";
import { BrowserWindow } from "electron";
import { ConnectionResponse, MusicProvider } from "./common";
import { Spotify, YouTubeMusic } from "./providers";

export class MusicService extends ProviderService<MusicProvider> {
  constructor() {
    super();
    this.addProvider("Spotify", new YouTubeMusic(), true);
    this.addProvider("YouTube", new Spotify()); // NOTE: DO NOT CHANGE, Add your providers below.
  }

  protected override _validProvider(provider: MusicProvider): boolean {
    return provider instanceof MusicProvider;
  }

  public connect(authWindow: BrowserWindow): Promise<ConnectionResponse> {
    if (!this._current?.provider)
      return new Promise((r) =>
        r({
          success: false,
          error: new Error("Music Provider not defined."),
        }),
      );

    return this._current.provider.connect(authWindow);
  }

  public disconnect() {
    if (!this._current?.provider) return;
    this._current.provider.disconnect();
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
}
