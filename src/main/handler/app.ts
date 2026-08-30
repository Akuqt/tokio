import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import config from "@/config";
import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { MusicService } from "@/services/music";
import { PathManagerService } from "@/services/path";
import { ServerService } from "@/services/server";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { URLManagerService } from "@/services/url";
import { AppHandlerVariables, CustomBrowserWindow } from "@/types";
import {
  type App,
  type IpcMain,
  type NativeTheme,
  type session as Session,
  type Shell,
} from "electron";

export class AppHandler implements AppHandlerVariables {
  public readonly app: App;
  public readonly win: CustomBrowserWindow;
  public readonly musicWin: CustomBrowserWindow;
  public readonly ipcMain: IpcMain;
  public readonly shell: Shell;
  public readonly nativeTheme: NativeTheme;
  public readonly session: typeof Session;
  public readonly connectorService: TikTokConnectorService;
  public readonly ttsService: TTSService;
  public readonly musicService: MusicService;
  public readonly serverService: ServerService;
  public readonly urlManagerService: URLManagerService;
  public readonly jsonManagerService: JSONManagerService;
  public readonly storeManagerService: StoreManagerService;
  public readonly pathManagerService: PathManagerService;

  constructor(deps: AppHandlerVariables) {
    this.app = deps.app;
    this.win = deps.win;
    this.musicWin = deps.musicWin;
    this.ipcMain = deps.ipcMain;
    this.shell = deps.shell;
    this.session = deps.session;
    this.nativeTheme = deps.nativeTheme;
    this.connectorService = deps.connectorService;
    this.musicService = deps.musicService;
    this.ttsService = deps.ttsService;
    this.serverService = deps.serverService;
    this.urlManagerService = deps.urlManagerService;
    this.jsonManagerService = deps.jsonManagerService;
    this.storeManagerService = deps.storeManagerService;
    this.pathManagerService = deps.pathManagerService;
  }

  public async initApp() {
    this.initSession();
    this.initWindows();
  }

  private initWindows() {
    this.win.webContents.setWindowOpenHandler((details) => {
      this.shell.openExternal(details.url);
      return { action: "deny" };
    });

    this.win?.on("ready-to-show", () => {
      this.win?.show();
    });

    this.ipcMain.on(APP_EVENTS.MINIMIZE_WINDOW, () => {
      this.win.minimize();
    });

    this.ipcMain.on(APP_EVENTS.MAXIMIZE_WINDOW, () => {
      if (this.win.isMaximized()) {
        this.win.unmaximize();
      } else {
        this.win.maximize();
      }
    });

    this.win?.on("resize", () => {
      if (this.win?.isNormal()) {
        this.win.webContents.send(APP_EVENTS_RESPONSE.RESIZE_WINDOW, {
          state: "normal",
        });
      } else {
        this.win?.webContents.send(APP_EVENTS_RESPONSE.RESIZE_WINDOW, {
          state: "maximized",
        });
      }
    });

    this.ipcMain.on(APP_EVENTS.CLOSE_WINDOW, () => {
      this.win.close();
    });

    this.musicWin.on("resize", () => {
      if (this.musicWin.isNormal()) {
        this.musicWin.webContents.send(
          APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW,
          {
            state: "normal",
          },
        );
      } else {
        this.musicWin?.webContents.send(
          APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW,
          {
            state: "maximized",
          },
        );
      }
    });

    this.ipcMain.on(APP_EVENTS.MAXIMIZE_MUSIC_WINDOW, () => {
      if (this.musicWin.isMaximized()) {
        this.musicWin.unmaximize();
      } else {
        this.musicWin.maximize();
      }
    });

    this.ipcMain.on(APP_EVENTS.MINIMIZE_MUSIC_WINDOW, () => {
      if (this.musicWin && !this.musicWin.isDestroyed()) {
        this.musicWin.minimize();
      }
    });

    this.ipcMain.on(APP_EVENTS.CLOSE_MUSIC_WINDOW, () => {
      if (this.musicWin && !this.musicWin.isDestroyed()) {
        this.musicWin.close();
      }
    });
  }

  private initSession() {
    const csp = this.app.isPackaged ? config.CSP.prod : config.CSP.dev;

    this.session.defaultSession.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [csp],
          },
        });
      },
    );
  }
}
