export * from "./connector";
export * from "./server";

export type EventCallback<T, U, K> = (
  handler: T,
  event: U,
  ...args: K[]
) => void;

export interface EventItem<T, U, K> {
  event: string;
  callback: EventCallback<T, U, K>;
}

export type LoggerOptions = { file: boolean; path: string };

export interface Folders {
  readonly appFolder: string;
  readonly binFolder: string;
  readonly settingsFolder: string;
  readonly logsFolder: string;
  readonly overlaysFolder: string;
  readonly dbFolder: string;
}

export interface Files {
  readonly logs: {
    readonly connector: string;
    readonly system: string;
    readonly overlayServer: string;
  };
  readonly ffmpeg: string;
}

export enum THEME_MODE {
  DARK = "dark",
  LIGHT = "light",
  SYSTEM = "system",
}

export interface AppConfig {
  id: number;
  log2file: boolean;
  enable_server: boolean;
  server_port: number;
  use_session_id: boolean;
  session_id: string;
  theme_mode: THEME_MODE;
  theme_name: string;
}
