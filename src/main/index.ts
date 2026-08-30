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
  session,
  shell,
  WebContentsView,
} from "electron";
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
let musicWin: BrowserWindow | null = null;

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

  musicWin = new BrowserWindow({
    width: 1280,
    height: 840,
    minHeight: 840,
    minWidth: 1280,
    show: false,
    title: "Tokio",
    center: true,
    resizable: true,
    titleBarStyle: "hidden",
    autoHideMenuBar: true,
    icon: APP_ICON,
    webPreferences: {
      sandbox: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  const navView = new WebContentsView({
    webPreferences: {
      sandbox: false,
      contextIsolation: false,
      preload: APP_PRELOAD,
    },
  });

  musicWin.contentView.addChildView(navView);

  const updateNavBounds = () => {
    const bounds = musicWin!.getContentBounds();
    navView.setBounds({ x: 0, y: 0, width: bounds.width, height: 40 });
  };

  updateNavBounds();
  musicWin.on("resize", updateNavBounds);

  musicWin.on("close", async () => {
    try {
      musicWin!.contentView.removeChildView(navView);
    } catch {
      // Next
    }
  });

  win.on("close", () => {
    if (musicWin && !musicWin.isDestroyed()) {
      musicWin.close();
    }
  });

  new Handler({
    app,
    win,
    musicWin,
    shell,
    ipcMain,
    session,
    ...services,
  }).init(events);

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    navView.webContents.loadURL("http://localhost:8989");
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
    navView.webContents.loadFile(join(__dirname, "../../music/index.html"));
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
