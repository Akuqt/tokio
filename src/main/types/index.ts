import {
  DBManagerService,
  JsonManagerService,
  PathManagerService,
  ServerService,
  TikTokConnectorServices,
  TTSServices,
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
  readonly connectorService: TikTokConnectorServices;
  readonly ttsService: TTSServices;
  readonly serverService: ServerService;
  readonly urlManagerService: URLManagerService;
  readonly jsonManagerService: JsonManagerService;
  readonly dbManagerService: DBManagerService;
  readonly pathManagerService: PathManagerService;
}
