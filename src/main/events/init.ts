import { ProfileSchema, ThemeSchema } from "@/common/schemas";
import { APP_EVENTS } from "@/common/types";
import { createStack } from "@/helper";
import { join } from "path";

const events = createStack();

events.push(
  APP_EVENTS.GET_THEME,
  async (
    {
      storeManagerService,
      jsonManagerService,
      nativeTheme,
      pathManagerService,
    },
    e,
  ) => {
    try {
      const config = storeManagerService.getSettings();
      let mode = "dark";
      if (config.appearance.mode == "system") {
        if (!nativeTheme.shouldUseDarkColors) {
          mode = "light";
        }
      } else {
        mode = config.appearance.mode;
      }
      const file = config.appearance.activeThemeFile;
      const theme = await jsonManagerService.loadFile(
        join(pathManagerService.folders.themesFolder, file),
        ThemeSchema,
      );
      e.reply(APP_EVENTS.RES_GET_THEME, {
        success: true,
        theme,
        mode,
      });
    } catch {
      e.reply(APP_EVENTS.RES_GET_THEME, { success: false });
    }
  },
);

events.push(
  APP_EVENTS.SET_THEME_MODE,
  async ({ storeManagerService }, _, { mode }) => {
    try {
      storeManagerService.updateAppearance(mode);
    } catch {
      // next
    }
  },
);

events.push(
  APP_EVENTS.GET_PROFILE,
  async (
    { storeManagerService, jsonManagerService, pathManagerService },
    e,
  ) => {
    try {
      const config = storeManagerService.getSettings();
      const file = config.activeProfileFile;
      const profile = await jsonManagerService.loadFile(
        join(pathManagerService.folders.profilesFolder, file),
        ProfileSchema,
      );
      const profiles = storeManagerService.getProfiles().map((p) => ({
        name: p.name,
        file: p.file,
        active: p.file === config.activeProfileFile,
      }));
      e.reply(APP_EVENTS.RES_GET_PROFILE, {
        success: true,
        profile,
        profiles,
      });
    } catch {
      e.reply(APP_EVENTS.RES_GET_PROFILE, { success: false });
    }
  },
);

events.push(
  APP_EVENTS.SET_PROFILE,
  async (
    { storeManagerService, jsonManagerService, pathManagerService },
    e,
    { file },
  ) => {
    try {
      const config = storeManagerService.getSettings();
      if (config.activeProfileFile === file) {
        return;
      }
      const k = storeManagerService.getProfiles();
      const tmp = k.find((p) => p.file === file);
      if (!tmp) return;
      const profile = await jsonManagerService.loadFile(
        join(pathManagerService.folders.profilesFolder, tmp.file),
        ProfileSchema,
      );
      const profiles = k.map((p) => ({
        name: p.name,
        file: p.file,
        active: p.file === file,
      }));
      storeManagerService.updateActiveProfile(tmp.file);
      e.reply(APP_EVENTS.RES_GET_PROFILE, {
        success: true,
        profile,
        profiles,
      });
    } catch {
      // Next
    }
  },
);

events.push(
  APP_EVENTS.GET_SERVICE_PROVIDERS,
  async ({ ttsService, connectorService }, e) => {
    try {
      const ttsProviders = ttsService
        .getProviders()
        .map((p) => ({ ...p, type: "tts" }));
      const connProviders = connectorService
        .getProviders()
        .map((p) => ({ ...p, type: "connector" }));

      e.reply(APP_EVENTS.RES_GET_SERVICE_PROVIDERS, {
        services: [...ttsProviders, ...connProviders],
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS.RES_GET_SERVICE_PROVIDERS, { success: false });
    }
  },
);

events.push(APP_EVENTS.GET_VOICES, async ({ ttsService }, e) => {
  try {
    const voices = ttsService.getVoices();
    e.reply(APP_EVENTS.RES_GET_VOICES, {
      voices,
      success: true,
    });
  } catch {
    e.reply(APP_EVENTS.RES_GET_VOICES, { success: false });
  }
});

events.push(
  APP_EVENTS.SET_SERVICE_PROVIDER,
  async ({ ttsService, connectorService }, e, { name, type, key }) => {
    try {
      if (type === "tts") {
        ttsService.setProvider(name, key);
      }
      if (type === "connector") {
        connectorService.setProvider(name, key);
      }
      const ttsProviders = ttsService
        .getProviders()
        .map((p) => ({ ...p, type: "tts" }));
      const connProviders = connectorService
        .getProviders()
        .map((p) => ({ ...p, type: "connector" }));
      e.reply(APP_EVENTS.RES_GET_SERVICE_PROVIDERS, {
        services: [...ttsProviders, ...connProviders],
        success: true,
      });
    } catch {
      // Next
    }
  },
);

events.push(
  APP_EVENTS.UPDATE_TTS_SETTINGS,
  async (
    { storeManagerService, jsonManagerService, pathManagerService },
    e,
    { settings },
  ) => {
    try {
      const config = storeManagerService.getSettings();
      await jsonManagerService.updateFile(
        join(
          pathManagerService.folders.profilesFolder,
          config.activeProfileFile,
        ),
        ProfileSchema,
        {
          tts: settings,
        },
      );
      e.reply(APP_EVENTS.RES_UPDATE_TTS_SETTINGS, {
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS.RES_UPDATE_TTS_SETTINGS, {
        success: false,
      });
    }
  },
);

events.push(
  APP_EVENTS.GET_TTS_TEST,
  async ({ ttsService }, e, { text, voice }) => {
    try {
      const res = await ttsService.generateBuffer(text, voice.lang, voice.name);
      if (!res.success || !res.buffer) {
        e.reply(APP_EVENTS.RES_GET_TTS_TEST, {
          success: false,
        });
        return;
      }
      const audio = new Uint8Array(res.buffer);
      e.reply(APP_EVENTS.RES_GET_TTS_TEST, {
        data: audio,
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS.RES_GET_TTS_TEST, {
        success: false,
      });
    }
  },
);

export default events;
