import { Folders } from "@/common/types";
import { TikTokLiveConnector } from "@/connector";
import { checkInternetConnection } from "@/helper/network";
import { TTSService } from "@/tts";
import { AppHandlerVariables } from "@/types";
import type {
  App,
  BrowserWindow,
  IpcMain,
  session as Session,
  Shell,
} from "electron";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "path";

export class AppHandler implements AppHandlerVariables {
  public internet: boolean;
  public readonly tts: TTSService;
  public readonly connector: TikTokLiveConnector;
  public readonly folders: Folders;
  public readonly app: App;
  public readonly win: BrowserWindow;
  public readonly ipcMain: IpcMain;
  private readonly shell: Shell;
  private readonly session: typeof Session;

  constructor(
    app: App,
    win: BrowserWindow,
    ipcMain: IpcMain,
    shell: Shell,
    session: typeof Session,
  ) {
    this.app = app;
    this.win = win;
    this.ipcMain = ipcMain;
    this.shell = shell;
    this.session = session;
    this.connector = new TikTokLiveConnector();
    this.tts = new TTSService();
    this.internet = true;
    const home = this.app.getPath("home");
    const appFolder = resolve(join(home, ".tokio"));
    const binFolder = resolve(join(appFolder, "bin"));
    const settingsPath = resolve(join(appFolder, "settings"));
    this.folders = {
      appFolder,
      binFolder,
      settingsPath,
    };
  }

  protected async initApp() {
    this.initWindow();
    this.initSession();
    await this.checkInternet();
    await this.initFolders();
  }

  private async checkInternet() {
    const interval = setInterval(async () => {
      this.internet = await checkInternetConnection();
      this.win?.webContents.send("internet:connection", this.internet);
    }, 500);
    this.win.on("closed", () => {
      clearInterval(interval);
    });
  }

  private async initFolders() {
    if (!existsSync(this.folders.appFolder))
      await mkdir(this.folders.appFolder, { recursive: true });
    if (!existsSync(this.folders.binFolder))
      await mkdir(this.folders.binFolder, { recursive: true });
    if (!existsSync(this.folders.settingsPath))
      await mkdir(this.folders.settingsPath, { recursive: true });
  }

  private initWindow() {
    this.win.webContents.setWindowOpenHandler((details) => {
      this.shell.openExternal(details.url);
      return { action: "deny" };
    });

    this.win?.on("ready-to-show", async () => {
      this.win?.show();
    });
  }

  private initSession() {
    const csp = this.app.isPackaged
      ? "default-src 'self'; media-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline';"
      : "default-src 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:5173 http://localhost:5173;";

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
