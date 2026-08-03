import { Folders } from "@/common/types";
import { TikTokLiveConnector } from "@/connector";
import { checkInternetConnection } from "@/helper/network";
import { TTSService } from "@/tts";
import { AppHandlerVariables } from "@/types";
import { App, BrowserWindow, IpcMain, Shell } from "electron";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, resolve } from "path";

export class AppHandler implements AppHandlerVariables {
  public internet: boolean;
  public connector: TikTokLiveConnector | null;
  public tts: TTSService | null;
  public readonly folders: Folders;
  public readonly app: App;
  public readonly win: BrowserWindow;
  public readonly ipcMain: IpcMain;
  private readonly shell: Shell;

  constructor(app: App, win: BrowserWindow, ipcMain: IpcMain, shell: Shell) {
    this.app = app;
    this.win = win;
    this.ipcMain = ipcMain;
    this.shell = shell;
    this.connector = null;
    this.tts = null;
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

  public async initApp() {
    this.initWindow();
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
}
