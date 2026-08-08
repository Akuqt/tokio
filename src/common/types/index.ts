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

export interface Folders {
  appFolder: string;
  settingsFolder: string;
  logsFolder: string;
  overlaysFolder: string;
  profilesFolder: string;
  themesFolder: string;
}

export interface Files {
  logs: {
    connector: string;
    tts: string;
    system: string;
    server: string;
  };
}

export enum THEME_MODE {
  DARK = "dark",
  LIGHT = "light",
  SYSTEM = "system",
}

export interface AppTheme {
  id?: number;
  name: string;
  path: string;
}

export interface AppProfile {
  id?: number;
  name: string;
  path: string;
}

export interface AppProvider {
  id?: number;
  name: string;
  key: string;
}

export interface AppConfig {
  id?: number;
  enable_server: boolean;
  server_port: number;
  theme_mode: THEME_MODE;
  theme: AppTheme;
  profile: AppProfile;
  connector_provider: AppProvider;
  tts_provider: AppProvider;
}

export type Provider = { name: string; active: boolean };
