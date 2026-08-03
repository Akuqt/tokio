import { Files, Folders } from "@/common/types";
import { TikTokLiveConnector } from "@/connector";
import { TTSService } from "@/tts";
import { App, BrowserWindow, IpcMain } from "electron";

export interface AppHandlerVariables {
  internet: boolean;
  readonly connector: TikTokLiveConnector;
  readonly tts: TTSService;
  readonly folders: Folders;
  readonly files: Files;
  readonly app: App;
  readonly win: BrowserWindow;
  readonly ipcMain: IpcMain;
}
