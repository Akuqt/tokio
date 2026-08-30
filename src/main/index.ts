import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { MusicService } from "@/services/music";
import { PathManagerService } from "@/services/path";
import { ServerService } from "@/services/server";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { URLManagerService } from "@/services/url";
import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import { join } from "path";
import events from "./events";
import Handler from "./handler";

app.commandLine.appendSwitch(
  "webrtc-ip-handling-policy",
  "default_public_interface_only",
);
app.commandLine.appendSwitch("log-level", "3");
app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows", "true");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");

const services = {
  ttsService: new TTSService(),
  musicService: new MusicService(),
  serverService: new ServerService(),
  urlManagerService: new URLManagerService(),
  jsonManagerService: new JSONManagerService(),
  pathManagerService: new PathManagerService(),
  connectorService: new TikTokConnectorService(),
  storeManagerService: new StoreManagerService(),
};

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

  createWindows();
});

app.on("window-all-closed", () => {
  app.quit();
});
