export type Provider = { name: string; active: boolean; key: string };

export type VoiceData = {
  name: string;
  lang: string;
};

export interface Folders {
  appFolder: string;
  settingsFolder: string;
  logsFolder: string;
  overlaysFolder: string;
  profilesFolder: string;
}

export interface Files {
  logs: {
    connector: string;
    tts: string;
    system: string;
    server: string;
  };
}
