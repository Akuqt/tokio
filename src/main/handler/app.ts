import config from "@/config";
import { checkInternetConnection } from "@/helper";
import type {
  DBManagerService,
  JSONManagerService,
  PathManagerService,
  ServerService,
  TikTokConnectorService,
  TTSService,
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
  public readonly connectorService: TikTokConnectorService;
  public readonly ttsService: TTSService;
  public readonly serverService: ServerService;
  public readonly urlManagerService: URLManagerService;
  public readonly jsonManagerService: JSONManagerService;
  public readonly dbManagerService: DBManagerService;
  public readonly pathManagerService: PathManagerService;

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
    await this.pathManagerService.initialize(
      this.app.getPath("home"),
      config.APP.folderName,
      ({ files }) => {
        this.connectorService.setLogFile(files.logs.connector);
        this.ttsService.setLogFile(files.logs.tts);
        this.serverService.setLogFile(files.logs.server);
        this.urlManagerService.setLogFile(files.logs.system);
        this.dbManagerService.setLogFile(files.logs.system);
        this.jsonManagerService.setLogFile(files.logs.system);
      },
    );
    await this.checkInternet();
    await this.dbManagerService.initialize(
      config.DB.name,
      config.DB.providers,
      this.jsonManagerService,
      this.pathManagerService,
    );
    await this.initOverlayServer();
    this.serverService.initEvents(this.connectorService);
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
