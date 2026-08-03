import { Folders } from "@/common/types";
import { TikTokLiveConnector } from "@/connector";
import { TTSService } from "@/tts";
import { App, BrowserWindow, IpcMain } from "electron";

export interface AppHandlerVariables {
  internet: boolean;
  connector: TikTokLiveConnector | null;
  tts: TTSService | null;
  readonly folders: Folders;
  readonly app: App;
  readonly win: BrowserWindow;
  readonly ipcMain: IpcMain;
}
