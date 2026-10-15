import { formatError } from "@/common/util";
import Logger from "@/logger";
import { AlertsService } from "@/services/alerts";
import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { MusicService } from "@/services/music";
import { PathManagerService } from "@/services/path";
import { ServerService } from "@/services/server";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { URLManagerService } from "@/services/url";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import {
  app,
  BrowserWindow,
  ipcMain,
  net,
  protocol,
  session,
  shell,
} from "electron";
import { join } from "path";
import { pathToFileURL } from "url";
import events from "./events";
import Handler from "./handler";
import { YAMLManagerService } from "./services/yaml";
import { AppServices } from "./types";

app.commandLine.appendSwitch(
  "webrtc-ip-handling-policy",
  "default_public_interface_only",
);
app.commandLine.appendSwitch("log-level", "3");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows", "true");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

const services: AppServices = {
  alertsService: new AlertsService(),
  ttsService: new TTSService(),
  musicService: new MusicService(),
  serverService: new ServerService(),
  urlManagerService: new URLManagerService(),
  jsonManagerService: new JSONManagerService(),
  pathManagerService: new PathManagerService(),
  connectorService: new TikTokConnectorService(),
  storeManagerService: new StoreManagerService(),
  yamlManagerService: new YAMLManagerService(),
};

const logFatal = (kind: string) => (error: unknown) => {
  Logger.error(
    `<System> ${kind} -- ${formatError(error)}`,
    services.pathManagerService.files?.logs.system,
  );
};

// The monitor only observes, so Electron still handles the exception as usual.
process.on("uncaughtExceptionMonitor", logFatal("Uncaught exception"));
// Electron only warns about these, the listener keeps that behavior.
process.on("unhandledRejection", logFatal("Unhandled rejection"));

const APP_ICON = join(__dirname, "../../resources/icon.png");
const APP_PRELOAD = join(__dirname, "../preload/index.mjs");

let win: BrowserWindow | null = null;

function createWindows(): void {
  win = new BrowserWindow({
    width: 600,
    minWidth: 600,
    height: 400,
    minHeight: 400,
    resizable: false,
    show: false,
    titleBarStyle: "hidden",
    title: "Tokio",
    center: true,
    autoHideMenuBar: true,
    icon: APP_ICON,
    webPreferences: {
      preload: APP_PRELOAD,
      sandbox: false,
    },
  });

  new Handler({
    app,
    win,
    shell,
    ipcMain,
    session,
    ...services,
  }).init(events);

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId("com.ialfaro.tokio");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  protocol.handle("local-resource", (request) => {
    const requestUrl = new URL(request.url);

    let decodedPath = decodeURIComponent(requestUrl.pathname);

    if (process.platform === "win32" && decodedPath.match(/^\/[a-zA-Z]:\//)) {
      decodedPath = decodedPath.slice(1);
    }

    return net.fetch(pathToFileURL(decodedPath).href);
  });

  createWindows();
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("will-quit", () => {
  services.ttsService.dispose();
});
