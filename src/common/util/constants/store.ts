import { StoreSchema } from "@/common/schemas";
import { THEME_MODE } from "@/common/types";

export const defaultStoreData: StoreSchema = {
  settings: {
    server: {
      enabled: false,
      port: 6767,
    },
    appearance: {
      mode: THEME_MODE.SYSTEM,
      activeThemeFile: "default.json",
    },
    activeProfileFile: "default.json",
    providers: {
      tts: { name: "TikTok", key: "" },
      connector: { name: "TikTok", key: "" },
    },
  },
  themes: [{ file: "default.json", name: "Default" }],
  profiles: [{ file: "default.json", name: "Default" }],
};
