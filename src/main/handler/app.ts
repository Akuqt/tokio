import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import config from "@/config";
import { Notifier } from "@/helper/feedback";
import { isOverlayURL } from "@/helper/network";
import { AlertsService } from "@/services/alerts";
import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { LicensesService } from "@/services/licenses";
import { MusicService } from "@/services/music";
import { OverlayService } from "@/services/overlay";
import { PathManagerService } from "@/services/path";
import { ServerService } from "@/services/server";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { UpdaterService } from "@/services/updater";
import { URLManagerService } from "@/services/url";
import { YAMLManagerService } from "@/services/yaml";
import { AppHandlerVariables, CustomBrowserWindow } from "@/types";
import {
  BrowserWindow,
  type App,
  type IpcMain,
  type session as Session,
  type Shell,
} from "electron";

export class AppHandler implements AppHandlerVariables {
  public readonly app: App;
  public readonly win: CustomBrowserWindow;
  public readonly ipcMain: IpcMain;
  public readonly shell: Shell;
  public readonly session: typeof Session;
  public readonly connectorService: TikTokConnectorService;
  public readonly ttsService: TTSService;
  public readonly musicService: MusicService;
  public readonly serverService: ServerService;
  public readonly overlayService: OverlayService;
  public readonly urlManagerService: URLManagerService;
  public readonly jsonManagerService: JSONManagerService;
  public readonly yamlManagerService: YAMLManagerService;
  public readonly storeManagerService: StoreManagerService;
  public readonly pathManagerService: PathManagerService;
  public readonly alertsService: AlertsService;
  public readonly licensesService: LicensesService;
  public readonly updaterService: UpdaterService;
  public readonly notifier: Notifier;

  constructor(deps: AppHandlerVariables) {
    Object.assign(this, deps);
  }

  public async initApp() {
    this.initSession();
    this.initWindow();
  }

  private initWindow() {
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

    this.win.on("close", () => {
      BrowserWindow.getAllWindows().forEach((window) => {
        window.close();
      });
    });

    this.ipcMain.on(APP_EVENTS.CLOSE_WINDOW, () => {
      this.win.close();
    });
  }

  private initSession() {
    const csp = this.app.isPackaged ? config.CSP.prod : config.CSP.dev;
    this.session.defaultSession.webRequest.onBeforeRequest(
      config.URL_FILTER,
      (details, callback) => {
        if (details.resourceType === "webSocket") {
          callback({ cancel: true });
          return;
        }
        callback({ cancel: false });
      },
    );

    this.session.defaultSession.webRequest.onHeadersReceived(
      (details, callback) => {
        // Overlays run without a CSP, as in OBS, so they can use inline
        // scripts and load scripts, styles and fonts from the network.
        if (isOverlayURL(details.url)) {
          callback({ responseHeaders: details.responseHeaders });
          return;
        }
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
