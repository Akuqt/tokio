import { APP_EVENTS, AppEventsMap } from "@/common/types";
import {
  JSONManagerService,
  PathManagerService,
  ServerService,
  StoreManagerService,
  TikTokConnectorService,
  TTSService,
  URLManagerService,
} from "@/services";
import {
  App,
  BrowserWindow,
  IpcMain,
  IpcMainEvent,
  NativeTheme,
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
  readonly nativeTheme: NativeTheme;
  readonly connectorService: TikTokConnectorService;
  readonly ttsService: TTSService;
  readonly serverService: ServerService;
  readonly urlManagerService: URLManagerService;
  readonly jsonManagerService: JSONManagerService;
  readonly storeManagerService: StoreManagerService;
  readonly pathManagerService: PathManagerService;
}

export type EventCallback<K extends APP_EVENTS> = (
  handler: AppHandlerVariables,
  event: IpcMainEvent,
  data: AppEventsMap[K],
) => void;

export interface EventItem<K extends APP_EVENTS> {
  event: K;
  callback: EventCallback<K>;
}
