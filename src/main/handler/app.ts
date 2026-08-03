import { Files, Folders } from "@/common/types";
import config from "@/config";
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
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "path";

export class AppHandler implements AppHandlerVariables {
  public internet: boolean;
  public readonly tts: TTSService;
  public readonly connector: TikTokLiveConnector;
  public readonly folders: Folders;
  public readonly files: Files;
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
    const settingsFolder = resolve(join(appFolder, "settings"));
    const logsFolder = resolve(join(appFolder, "logs"));
    const overlaysFolder = resolve(join(appFolder, "overlays"));
    this.folders = {
      appFolder,
      binFolder,
      settingsFolder,
      logsFolder,
      overlaysFolder,
    };
    this.files = {
      logs: {
        connector: resolve(join(this.folders.logsFolder, "connector.log")),
      },
      ffmpeg: resolve(join(this.folders.binFolder, "ffmpeg.exe")),
    };
    this.connector.setLogOptions({
      file: true, // TODO: Update this later
      path: this.files.logs.connector,
    });
  }

  protected async initApp() {
    await this.initFolders();
    await this.initFiles();
    await this.checkInternet();
    this.initSession();
    this.initWindow();
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
    if (!existsSync(this.folders.settingsFolder))
      await mkdir(this.folders.settingsFolder, { recursive: true });
    if (!existsSync(this.folders.logsFolder))
      await mkdir(this.folders.logsFolder, { recursive: true });
    if (!existsSync(this.folders.overlaysFolder))
      await mkdir(this.folders.overlaysFolder, { recursive: true });
  }

  private async initFiles() {
    if (!existsSync(this.files.logs.connector))
      await writeFile(this.files.logs.connector, "", { encoding: "utf-8" });
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
