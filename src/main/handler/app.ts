import { Files, Folders, THEME_MODE, TIKTOK_EVENTS } from "@/common/types";
import config from "@/config";
import { TikTokConnectorServices } from "@/connector";
import { AppDataBase } from "@/db";
import { JsonFileManager } from "@/files";
import { checkInternetConnection } from "@/helper/network";
import { OverlayServer } from "@/server";
import { TTSServices } from "@/tts";
import { AppHandlerVariables } from "@/types";
import { URLManager } from "@/url";
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
  public readonly urlManager: URLManager;
  public readonly tts: TTSServices;
  public readonly connector: TikTokConnectorServices;
  public readonly jsonfileManager: JsonFileManager;
  public readonly server: OverlayServer;
  public readonly folders: Folders;
  public readonly files: Files;
  public readonly app: App;
  public readonly win: BrowserWindow;
  public readonly ipcMain: IpcMain;
  public readonly db: AppDataBase;
  private readonly shell: Shell;
  private readonly session: typeof Session;
  protected _log2file: boolean = true;

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
    this.connector = new TikTokConnectorServices();
    this.tts = new TTSServices();
    this.server = new OverlayServer();
    this.urlManager = new URLManager();
    this.jsonfileManager = new JsonFileManager();
    this.internet = true;
    const home = this.app.getPath("home");
    const appFolder = resolve(join(home, ".tokio"));
    const binFolder = join(appFolder, "bin");
    const settingsFolder = join(appFolder, "settings");
    const logsFolder = join(appFolder, "logs");
    const overlaysFolder = join(appFolder, "overlays");
    const dbFolder = join(appFolder, "db");
    const profilesFolder = join(appFolder, "profiles");
    const themesFolder = join(appFolder, "themes");
    const dbPath = join(dbFolder, config.DB.name);
    this.folders = {
      appFolder,
      binFolder,
      settingsFolder,
      logsFolder,
      overlaysFolder,
      profilesFolder,
      themesFolder,
      dbFolder,
    };
    this.files = {
      logs: {
        connector: join(this.folders.logsFolder, "connector.log"),
        system: join(this.folders.logsFolder, "system.log"),
        overlayServer: join(this.folders.logsFolder, "overlay_server.log"),
      },
      ffmpeg: join(this.folders.binFolder, "ffmpeg.exe"),
    };
    this.db = new AppDataBase(dbPath, {
      fileManager: this.jsonfileManager,
      appConfig: {
        enable_server: false,
        server_port: 6767,
        session_id: "",
        use_session_id: false,
        theme_mode: THEME_MODE.SYSTEM,
        profile: {
          name: "default",
          path: join(this.folders.profilesFolder, "default.json"),
        },
        theme: {
          name: "default",
          path: join(this.folders.themesFolder, "default.json"),
        },
      },
    });
    this.setLog2File(true);
  }

  protected async initApp() {
    await this.initFolders();
    await this.initFiles();
    await this.checkInternet();
    await this.db.initialize();
    await this.initOverlayServer();
    this.initOverlayEvents();
    this.initSession();
    this.initWindow();
  }

  private setLog2File(file: boolean) {
    this._log2file = file;
    this.connector.setLogOptions({
      file: this._log2file,
      path: this.files.logs.connector,
    });
    this.server.setLogOptions({
      file: this._log2file,
      path: this.files.logs.overlayServer,
    });
    this.urlManager.setLogOptions({
      file: this._log2file,
      path: this.files.logs.system,
    });
    this.db.setLogOptions({
      file: this._log2file,
      path: this.files.logs.system,
    });
    this.jsonfileManager.setLogOptions({
      file: this._log2file,
      path: this.files.logs.system,
    });
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
    if (!existsSync(this.folders.dbFolder))
      await mkdir(this.folders.dbFolder, { recursive: true });
    if (!existsSync(this.folders.profilesFolder))
      await mkdir(this.folders.profilesFolder, { recursive: true });
    if (!existsSync(this.folders.themesFolder))
      await mkdir(this.folders.themesFolder, { recursive: true });
  }

  private async initFiles() {
    if (!existsSync(this.files.logs.connector))
      await writeFile(this.files.logs.connector, "", { encoding: "utf-8" });
    if (!existsSync(this.files.logs.system))
      await writeFile(this.files.logs.system, "", { encoding: "utf-8" });
    if (!existsSync(this.files.logs.overlayServer))
      await writeFile(this.files.logs.overlayServer, "", { encoding: "utf-8" });
  }

  private async initOverlayServer() {
    const res = await this.server.start();
    if (!res.success) throw new Error(res.message);
  }

  private initOverlayEvents() {
    this.connector.on(TIKTOK_EVENTS.CHAT, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.CHAT, data);
    });
    this.connector.on(TIKTOK_EVENTS.LIKE, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.LIKE, data);
    });
    this.connector.on(TIKTOK_EVENTS.GIFT, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.GIFT, data);
    });
    this.connector.on(TIKTOK_EVENTS.FOLLOW, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.FOLLOW, data);
    });
    this.connector.on(TIKTOK_EVENTS.SHARE, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.SHARE, data);
    });
    this.connector.on(TIKTOK_EVENTS.ENVELOPE, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.ENVELOPE, data);
    });
    this.connector.on(TIKTOK_EVENTS.SUPER_FAN_BOX, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.SUPER_FAN_BOX, data);
    });
    this.connector.on(TIKTOK_EVENTS.SUPER_FAN, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.SUPER_FAN, data);
    });
    this.connector.on(TIKTOK_EVENTS.MEMBER_JOIN, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.MEMBER_JOIN, data);
    });
    this.connector.on(TIKTOK_EVENTS.SUPER_FAN_JOIN, (data) => {
      this.server.broadcast(TIKTOK_EVENTS.SUPER_FAN_JOIN, data);
    });
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
