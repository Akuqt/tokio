import { StoreSchema } from "@/common/schemas";

export const defaultEntity = {
  file: "default.json",
  name: "Default",
};

const defaultProvider = { name: "Default", key: "", active: true };

export const defaultStoreData: StoreSchema = {
  settings: {
    server: {
      enabled: false,
      port: 6767,
    },
    activeFeatures: {
      tts: false,
    },
    liveStats: {
      likes: 0,
      viewers: 0,
      views: 0,
    },
    theme_mode: "system",
    activeTheme: defaultEntity,
    activeProfile: defaultEntity,
    activeConnProvider: defaultProvider,
    activeTTSProvider: defaultProvider,
    providers: {
      tts: [defaultProvider],
      connector: [defaultProvider],
    },
  },
  themes: [defaultEntity],
  profiles: [defaultEntity],
};
