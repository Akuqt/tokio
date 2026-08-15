import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import config from "@/config";
import { checkInternetConnection } from "@/helper/network";
import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { PathManagerService } from "@/services/path";
import { ServerService } from "@/services/server";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { URLManagerService } from "@/services/url";
import { AppHandlerVariables } from "@/types";
import type {
  App,
  BrowserWindow,
  IpcMain,
  NativeTheme,
  session as Session,
  Shell,
} from "electron";

export class AppHandler implements AppHandlerVariables {
  public internet: boolean;
  public readonly app: App;
  public readonly win: BrowserWindow;
  public readonly ipcMain: IpcMain;
  public readonly shell: Shell;
  public readonly nativeTheme: NativeTheme;
  public readonly session: typeof Session;
  public readonly connectorService: TikTokConnectorService;
  public readonly ttsService: TTSService;
  public readonly serverService: ServerService;
  public readonly urlManagerService: URLManagerService;
  public readonly jsonManagerService: JSONManagerService;
  public readonly storeManagerService: StoreManagerService;
  public readonly pathManagerService: PathManagerService;

  constructor(deps: Omit<AppHandlerVariables, "internet">) {
    this.app = deps.app;
    this.win = deps.win;
    this.ipcMain = deps.ipcMain;
    this.shell = deps.shell;
    this.session = deps.session;
    this.nativeTheme = deps.nativeTheme;
    this.connectorService = deps.connectorService;
    this.ttsService = deps.ttsService;
    this.serverService = deps.serverService;
    this.urlManagerService = deps.urlManagerService;
    this.jsonManagerService = deps.jsonManagerService;
    this.storeManagerService = deps.storeManagerService;
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
        this.storeManagerService.setLogFile(files.logs.system);
        this.jsonManagerService.setLogFile(files.logs.system);
      },
    );
    await this.checkInternet();
    await this.storeManagerService.initialize(
      config.DB.name,
      {
        connector: this.connectorService,
        tts: this.ttsService,
      },
      this.jsonManagerService,
      this.pathManagerService,
    );
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

  private initWindow() {
    this.win.webContents.setWindowOpenHandler((details) => {
      this.shell.openExternal(details.url);
      return { action: "deny" };
    });

    this.win?.on("ready-to-show", async () => {
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
