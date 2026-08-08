import config from "@/config";
import { checkInternetConnection } from "@/helper/network";
import type {
  DBManagerService,
  JsonManagerService,
  PathManagerService,
  ServerService,
  TikTokConnectorServices,
  TTSServices,
  URLManagerService,
} from "@/services";
import { AppHandlerVariables } from "@/types";
import type {
  App,
  BrowserWindow,
  IpcMain,
  session as Session,
  Shell,
} from "electron";

export class AppHandler implements AppHandlerVariables {
  public internet: boolean;
  public readonly app: App;
  public readonly win: BrowserWindow;
  public readonly ipcMain: IpcMain;
  public readonly shell: Shell;
  public readonly session: typeof Session;
  public readonly connectorService: TikTokConnectorServices;
  public readonly ttsService: TTSServices;
  public readonly serverService: ServerService;
  public readonly urlManagerService: URLManagerService;
  public readonly jsonManagerService: JsonManagerService;
  public readonly dbManagerService: DBManagerService;
  public readonly pathManagerService: PathManagerService;
  private _log2file: boolean = true;

  constructor(deps: Omit<AppHandlerVariables, "internet">) {
    this.app = deps.app;
    this.win = deps.win;
    this.ipcMain = deps.ipcMain;
    this.shell = deps.shell;
    this.session = deps.session;
    this.connectorService = deps.connectorService;
    this.ttsService = deps.ttsService;
    this.serverService = deps.serverService;
    this.urlManagerService = deps.urlManagerService;
    this.jsonManagerService = deps.jsonManagerService;
    this.dbManagerService = deps.dbManagerService;
    this.pathManagerService = deps.pathManagerService;
    this.internet = true;
  }

  public async initApp() {
    await this.pathManagerService.initialize(this.app.getPath("home"));
    this.setLog2File(true);
    await this.checkInternet();
    await this.dbManagerService.initialize(
      config.DB.name,
      this.jsonManagerService,
      this.pathManagerService,
    );
    await this.initOverlayServer();
    this.serverService.initEvents(this.connectorService);
    this.initSession();
    this.initWindow();
  }

  private setLog2File(file: boolean) {
    this._log2file = file;
    this.connectorService.setLogOptions({
      file: this._log2file,
      path: this.pathManagerService.files.logs.connector,
    });
    this.ttsService.setLogOptions({
      file: this._log2file,
      path: this.pathManagerService.files.logs.tts,
    });
    this.serverService.setLogOptions({
      file: this._log2file,
      path: this.pathManagerService.files.logs.server,
    });
    this.urlManagerService.setLogOptions({
      file: this._log2file,
      path: this.pathManagerService.files.logs.system,
    });
    this.dbManagerService.setLogOptions({
      file: this._log2file,
      path: this.pathManagerService.files.logs.system,
    });
    this.jsonManagerService.setLogOptions({
      file: this._log2file,
      path: this.pathManagerService.files.logs.system,
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

  private async initOverlayServer() {
    const res = await this.serverService.start();
    if (!res.success) throw new Error(res.message);
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
