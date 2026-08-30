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
      music: false,
    },
    liveStats: {
      likes: 0,
      viewers: 0,
      views: 0,
    },
    activeProfile: defaultEntity,
    activeConnProvider: defaultProvider,
    activeTTSProvider: defaultProvider,
    providers: {
      tts: [defaultProvider],
      connector: [defaultProvider],
    },
  },
  profiles: [defaultEntity],
};
