export enum THEME_MODE {
  DARK = "dark",
  LIGHT = "light",
  SYSTEM = "system",
}

export interface AppTheme {
  id?: number;
  file: string;
  name: string;
  path: string;
}

export interface AppProfile {
  id?: number;
  name: string;
  file: string;
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

export type VoiceData = {
  name: string;
  lang: string;
};

export type ServiceAppProvider = {
  name: string;
  active: boolean;
  type: "tts" | "connector";
};

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
