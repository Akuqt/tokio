import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  AppEventsMap,
  AppEventsResponseMap,
} from "@/common/types";
import { AlertsService } from "@/services/alerts";
import { TikTokConnectorService } from "@/services/connector";
import { JSONManagerService } from "@/services/json";
import { MusicService } from "@/services/music";
import { OverlayService } from "@/services/overlay";
import { PathManagerService } from "@/services/path";
import { ServerService } from "@/services/server";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { URLManagerService } from "@/services/url";
import { YAMLManagerService } from "@/services/yaml";
import {
  App,
  BrowserWindow,
  IpcMain,
  IpcMainEvent,
  session as Session,
  Shell,
  WebContents,
} from "electron";

type TypedWebContents = Omit<WebContents, "send"> & {
  send: <T extends APP_EVENTS_RESPONSE>(
    channel: T,
    args: AppEventsResponseMap[T],
  ) => void;
};

export type CustomBrowserWindow = Omit<BrowserWindow, "webContents"> & {
  webContents: TypedWebContents;
};

export interface AppServices {
  readonly connectorService: TikTokConnectorService;
  readonly ttsService: TTSService;
  readonly musicService: MusicService;
  readonly serverService: ServerService;
  readonly overlayService: OverlayService;
  readonly urlManagerService: URLManagerService;
  readonly jsonManagerService: JSONManagerService;
  readonly storeManagerService: StoreManagerService;
  readonly pathManagerService: PathManagerService;
  readonly yamlManagerService: YAMLManagerService;
  readonly alertsService: AlertsService;
}

export interface AppHandlerVariables extends AppServices {
  readonly app: App;
  readonly win: CustomBrowserWindow;
  readonly ipcMain: IpcMain;
  readonly shell: Shell;
  readonly session: typeof Session;
}

export type EventCallback<K extends APP_EVENTS> = (
  handler: AppHandlerVariables,
  event: Omit<IpcMainEvent, "reply"> & {
    reply: <T extends APP_EVENTS_RESPONSE>(
      event: T,
      args: AppEventsResponseMap[T],
    ) => void;
  },
  data: AppEventsMap[K],
) => void;

export interface EventItem<K extends APP_EVENTS> {
  event: K;
  callback: EventCallback<K>;
}
