import { Files, Folders } from "@/common/types";
import { TikTokLiveConnector } from "@/connector";
import { AppDataBase } from "@/db";
import { JsonFileManager } from "@/files";
import { OverlayServer } from "@/server";
import { TTSService } from "@/tts";
import { URLManager } from "@/url";
import { App, BrowserWindow, IpcMain } from "electron";

export interface AppHandlerVariables {
  internet: boolean;
  readonly connector: TikTokLiveConnector;
  readonly jsonfileManager: JsonFileManager;
  readonly server: OverlayServer;
  readonly tts: TTSService;
  readonly urlManager: URLManager;
  readonly folders: Folders;
  readonly files: Files;
  readonly app: App;
  readonly win: BrowserWindow;
  readonly ipcMain: IpcMain;
  readonly db: AppDataBase;
}
