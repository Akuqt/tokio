import "reflect-metadata";

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
import {
  DBManagerService,
  JSONManagerService,
  PathManagerService,
  ServerService,
  TikTokConnectorService,
  TTSService,
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
    width: 1200,
    minWidth: 1200,
    height: 800,
    minHeight: 800,
    show: false,
    titleBarStyle: "hidden",
    title: "Tokio",
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
    nativeTheme,
    pathManagerService: new PathManagerService(),
    connectorService: new TikTokConnectorService(),
    ttsService: new TTSService(),
    serverService: new ServerService(),
    urlManagerService: new URLManagerService(),
    jsonManagerService: new JSONManagerService(),
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
