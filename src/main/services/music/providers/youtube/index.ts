import { MUSIC_EVENTS, MusicEventMap } from "@/common/types";
import { delay } from "@/common/util";
import { type BrowserWindow, WebContentsView } from "electron";
import { EventEmitter } from "node:events";
import { ConnectionResponse, MusicProvider } from "../../common";
import {
  AfterSearchJSCode,
  ClickSelectorJSCode,
  LoginJSCode,
  PollingJSCode,
  SearchJSCode,
} from "./common";
import config from "./config";

export class YouTubeMusic extends MusicProvider {
  private _ytView: WebContentsView | null = null;
  private _shellWindow: BrowserWindow | null = null;
  private _pollingInterval: NodeJS.Timeout | null = null;
  private _events: EventEmitter;
  private _isFirstPlay: boolean = true;
  private _isActive: boolean = false;

  constructor() {
    super();
    this._events = new EventEmitter();
  }

  public setKey(_key: string): void {
    return;
  }

  public isActive(): boolean {
    return this._isActive;
  }

  public disconnect() {
    if (
      !this._isActive ||
      !this._ytView ||
      this._ytView.webContents.isDestroyed() ||
      !this._shellWindow ||
      this._shellWindow.isDestroyed()
    ) {
      return;
    }
    this.stopPolling();
    this._ytView.webContents.setAudioMuted(true);
    this._ytView.webContents.loadURL("about:blank");
    try {
      this._shellWindow?.contentView.removeChildView(this._ytView);
    } catch {
      // View already removed
    }
    this._isActive = false;
    this._ytView.webContents.close();
    this._shellWindow.close();
    this.emit(MUSIC_EVENTS.PROCCESS_ENDED);
    this._ytView = null;
    this._shellWindow = null;
  }

  public connect(
    window: BrowserWindow,
    requireAuth: boolean = true,
  ): Promise<ConnectionResponse> {
    this._shellWindow = window;

    this._ytView = new WebContentsView({
      webPreferences: {
        partition: "persist:music-youtube",
        backgroundThrottling: false,
      },
    });

    this._shellWindow.contentView.addChildView(this._ytView);

    const bounds = this._shellWindow.getContentBounds();
    this._ytView.setBounds({
      x: 0,
      y: 40,
      width: bounds.width,
      height: bounds.height - 40,
    });

    this._shellWindow.on("resize", () => {
      if (this._shellWindow && this._ytView) {
        const newBounds = this._shellWindow.getContentBounds();
        this._ytView.setBounds({
          x: 0,
          y: 40,
          width: newBounds.width,
          height: newBounds.height - 40,
        });
      }
    });

    this._ytView.webContents.on("will-prevent-unload", (event) => {
      event.preventDefault();
    });

    this._ytView.webContents.on("will-navigate", (event) => {
      const url = new URL(event.url);
      if (
        !url.hostname.includes("accounts.google.com") &&
        !url.hostname.includes("youtube.com")
      ) {
        event.preventDefault();
      }
    });

    this._shellWindow.on("close", () => {
      this.stopPolling();
      if (this._ytView && !this._ytView.webContents.isDestroyed()) {
        this._ytView.webContents.setAudioMuted(true);
        this._ytView.webContents.loadURL("about:blank");

        try {
          this._shellWindow?.contentView.removeChildView(this._ytView);
        } catch {
          // View already removed
        }
        this._isActive = false;
        this._ytView.webContents.close();
        this.emit(MUSIC_EVENTS.PROCCESS_ENDED);
      }
      this._ytView = null;
    });

    this._shellWindow!.show();

    return new Promise((res) => {
      if (!this._isActive) {
        res({
          success: true,
        });
      }
      const handleAuthAbort = () => {
        res({
          success: false,
          error: new Error("Authentication window was closed by the user"),
        });
      };

      this._shellWindow!.once("close", handleAuthAbort);
      this._ytView!.webContents.loadURL(config.YTM_URL);

      let isInitializing = true;
      let hasAttemptedLoginRedirect = false;

      const handleNavigation = async () => {
        if (!this._ytView || this._shellWindow?.isDestroyed()) return;

        const currentUrl = this._ytView.webContents.getURL();
        if (currentUrl.includes("accounts.google.com")) return;

        try {
          const loggedIn = await this.checkIsLoggedIn();

          if (loggedIn || !requireAuth) {
            if (isInitializing) {
              isInitializing = false;
              this.startPolling();
              this._shellWindow!.off("close", handleAuthAbort);
              this._isActive = true;
              res({ success: true });
            }
          } else if (isInitializing) {
            if (hasAttemptedLoginRedirect) {
              this._shellWindow!.off("close", handleAuthAbort);
              this._isActive = false;
              res({
                success: false,
                error: new Error("Login failed. Please try again."),
              });
              return;
            }
            hasAttemptedLoginRedirect = true;
            await this._ytView.webContents.session.clearStorageData();
            await this._ytView!.webContents.loadURL(config.YTM_LOGIN_URL);
          }
        } catch (err) {
          this._isActive = false;
          this._shellWindow!.off("close", handleAuthAbort);
          res({ success: false, error: err as Error });
        }
      };

      this._ytView!.webContents.on("did-finish-load", async () => {
        await handleNavigation();
      });
    });
  }

  public play() {
    return this.executeDOMClick('#play-pause-button[aria-label="Play"]');
  }

  public pause() {
    return this.executeDOMClick('#play-pause-button[aria-label="Pause"]');
  }

  public next() {
    return this.executeDOMClick(".next-button");
  }

  public previous() {
    return this.executeDOMClick(".previous-button");
  }

  public on<K extends MUSIC_EVENTS>(
    event: K,
    listener: (data: MusicEventMap[K]) => void,
  ): void {
    this._events.on(event, listener);
  }

  public async searchAndQueue(query: string): Promise<void> {
    if (!this._ytView) return;

    await this._ytView.webContents.executeJavaScript(SearchJSCode(query));

    await delay(250);

    this._ytView.webContents.sendInputEvent({
      type: "keyDown",
      keyCode: "Enter",
    });
    this._ytView.webContents.sendInputEvent({ type: "char", keyCode: "Enter" });
    this._ytView.webContents.sendInputEvent({
      type: "keyUp",
      keyCode: "Enter",
    });

    const result = await this._ytView.webContents.executeJavaScript(
      AfterSearchJSCode(query, this._isFirstPlay),
    );

    if (result && result.action === "played") {
      this._isFirstPlay = false;
    }
  }

  public stopPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  private async checkIsLoggedIn(): Promise<boolean> {
    if (!this._ytView) return false;

    const currentUrl = this._ytView.webContents.getURL();
    if (currentUrl.includes("accounts.google.com")) return false;

    try {
      return await this._ytView.webContents.executeJavaScript(LoginJSCode);
    } catch {
      return false;
    }
  }

  private startPolling(intervalMs: number = 3000) {
    this.stopPolling();

    this._pollingInterval = setInterval(async () => {
      if (!this._ytView) return;

      const currentUrl = this._ytView.webContents.getURL();
      if (currentUrl.includes("accounts.google.com")) return;

      try {
        const trackData =
          await this._ytView.webContents.executeJavaScript(PollingJSCode);

        if (trackData) {
          this.emit(MUSIC_EVENTS.TRACK_CHANGE, trackData);
        } else {
          this.emit(MUSIC_EVENTS.TRACK_CHANGE, null);
        }
      } catch {
        // Silently ignore execution errors
      }
    }, intervalMs);
  }

  private emit<K extends MUSIC_EVENTS>(
    event: K,
    data?: MusicEventMap[K],
  ): void {
    this._events.emit(event, data);
  }

  private async executeDOMClick(selector: string) {
    if (!this._ytView) return;

    await this._ytView.webContents.executeJavaScript(
      ClickSelectorJSCode(selector),
    );
  }
}
