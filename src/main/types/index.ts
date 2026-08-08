import {
  DBManagerService,
  JSONManagerService,
  PathManagerService,
  ServerService,
  TikTokConnectorService,
  TTSService,
  URLManagerService,
} from "@/services";
import {
  App,
  BrowserWindow,
  IpcMain,
  session as Session,
  Shell,
} from "electron";

export interface AppHandlerVariables {
  internet: boolean;
  readonly app: App;
  readonly win: BrowserWindow;
  readonly ipcMain: IpcMain;
  readonly shell: Shell;
  readonly session: typeof Session;
  readonly connectorService: TikTokConnectorService;
  readonly ttsService: TTSService;
  readonly serverService: ServerService;
  readonly urlManagerService: URLManagerService;
  readonly jsonManagerService: JSONManagerService;
  readonly dbManagerService: DBManagerService;
  readonly pathManagerService: PathManagerService;
}
