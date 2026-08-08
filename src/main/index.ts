import "reflect-metadata";

import { electronApp, is, optimizer } from "@electron-toolkit/utils";
import { app, BrowserWindow, ipcMain, session, shell } from "electron";
import { join } from "path";
import events from "./events";
import Handler from "./handler";
import {
  DBManagerService,
  JsonManagerService,
  PathManagerService,
  ServerService,
  TikTokConnectorServices,
  TTSServices,
  URLManagerService,
} from "./services";

app.commandLine.appendSwitch(
  "webrtc-ip-handling-policy",
  "default_public_interface_only",
);
app.commandLine.appendSwitch("log-level", "3");
app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");

let win: BrowserWindow | null = null;

function createWindow(): void {
  win = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
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
    pathManagerService: new PathManagerService(),
    connectorService: new TikTokConnectorServices(),
    ttsService: new TTSServices(),
    serverService: new ServerService(),
    urlManagerService: new URLManagerService(),
    jsonManagerService: new JsonManagerService(),
    dbManagerService: new DBManagerService(),
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
