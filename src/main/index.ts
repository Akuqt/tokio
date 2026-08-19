import "reflect-metadata";

import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
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
  nativeTheme,
  session,
  shell,
} from "electron";
import { join } from "path";
import events from "./events";
import Handler from "./handler";

app.commandLine.appendSwitch(
  "webrtc-ip-handling-policy",
  "default_public_interface_only",
);
app.commandLine.appendSwitch("log-level", "3");
app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");

let win: BrowserWindow | null = null;

const H = 400;
const W = 600;

function createWindow(): void {
  win = new BrowserWindow({
    width: W,
    minWidth: W,
    height: H,
    minHeight: H,
    resizable: false,
    show: false,
    titleBarStyle: "hidden",
    title: "Tokio",
    center: true,
    autoHideMenuBar: true,
    icon: join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      sandbox: false,
    },
  });

  new Handler({
    app,
    win,
    shell,
    ipcMain,
    session,
    nativeTheme,
    pathManagerService: new PathManagerService(),
    connectorService: new TikTokConnectorService(),
    ttsService: new TTSService(),
    serverService: new ServerService(),
    urlManagerService: new URLManagerService(),
    jsonManagerService: new JSONManagerService(),
    storeManagerService: new StoreManagerService(),
  }).init(events);

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    win.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.ialfaro.tokio");

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
