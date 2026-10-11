import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  CurrentSongInfo,
  SongInfo,
  TOKIO_EVENTS,
  TokioEventMap,
} from "@/common/types";
import { BrowserWindow, WebContentsView, type IpcMain } from "electron";
import { join } from "node:path";

export { MusicQueue } from "./queue";
export type ConnectionResponse = { success: boolean; error?: Error };

export abstract class MusicProvider {
  public abstract setKey(key: string): void;
  public abstract connect(ipcMain: IpcMain): Promise<ConnectionResponse>;
  public abstract disconnect(): void;
  public abstract play(track: SongInfo): Promise<void>;
  public abstract searchSong(query: string): Promise<SongInfo | null>;
  public abstract playerStatus(): Promise<CurrentSongInfo | null>;
  public abstract isActive(): boolean;
  public abstract on<K extends TOKIO_EVENTS>(
    event: K,
    listener: (data: TokioEventMap[K]) => void,
  ): void;
}

export function createWindow(ipcMain: IpcMain) {
  const APP_ICON = join(__dirname, "../../resources/icon.png");
  const APP_PRELOAD = join(__dirname, "../preload/index.mjs");

  const _shellWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minHeight: 840,
    minWidth: 1280,
    show: false,
    title: "Tokio",
    center: true,
    resizable: true,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    icon: APP_ICON,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  const _navView = new WebContentsView({
    webPreferences: {
      sandbox: false,
      contextIsolation: false,
      preload: APP_PRELOAD,
    },
  });

  _navView.webContents.loadFile(join(__dirname, "../../music-out/index.html"));

  _shellWindow.contentView.addChildView(_navView);

  const updateNavBounds = () => {
    const bounds = _shellWindow!.getContentBounds();
    _navView.setBounds({ x: 0, y: 0, width: bounds.width, height: 40 });
  };

  updateNavBounds();
  _shellWindow.on("resize", updateNavBounds);

  _shellWindow?.on("close", async () => {
    try {
      _shellWindow?.contentView.removeChildView(_navView);
    } catch {
      // Next
    }
  });

  _shellWindow?.on("resize", () => {
    if (_shellWindow?.isNormal()) {
      _shellWindow?.webContents.send(APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW, {
        state: "normal",
      });
    } else {
      _shellWindow?.webContents.send(APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW, {
        state: "maximized",
      });
    }
  });

  ipcMain.on(APP_EVENTS.MAXIMIZE_MUSIC_WINDOW, () => {
    if (_shellWindow?.isMaximized()) {
      _shellWindow?.unmaximize();
    } else {
      _shellWindow?.maximize();
    }
  });

  ipcMain.on(APP_EVENTS.MINIMIZE_MUSIC_WINDOW, () => {
    if (_shellWindow && !_shellWindow?.isDestroyed()) {
      _shellWindow?.minimize();
    }
  });

  ipcMain.on(APP_EVENTS.CLOSE_MUSIC_WINDOW, () => {
    if (_shellWindow && !_shellWindow?.isDestroyed()) {
      _shellWindow?.close();
    }
  });

  return _shellWindow;
}
