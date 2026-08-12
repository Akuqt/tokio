import { ProfileSchema, ThemeSchema } from "@/common/schemas";
import { APP_EVENTS, THEME_MODE } from "@/common/types";
import { createStack } from "@/helper";

const events = createStack();

events.push(
  APP_EVENTS.GET_THEME,
  async ({ dbManagerService, jsonManagerService, nativeTheme }, e) => {
    try {
      const config = await dbManagerService.getAppConfig();
      let mode = "dark";
      if (config.theme_mode == THEME_MODE.SYSTEM) {
        if (!nativeTheme.shouldUseDarkColors) {
          mode = "light";
        }
      } else {
        mode = config.theme_mode;
      }
      const path = config.theme.path;
      const theme = await jsonManagerService.loadFile(path, ThemeSchema);
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
  APP_EVENTS.GET_PROFILE,
  async ({ dbManagerService, jsonManagerService }, e) => {
    try {
      const config = await dbManagerService.getAppConfig();
      const path = config.profile.path;
      const profile = await jsonManagerService.loadFile(path, ProfileSchema);
      const profiles = (await dbManagerService.getAppProfiles()).map((p) => ({
        name: p.name,
        file: p.file,
        active: p.file === config.profile.file,
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
  async ({ dbManagerService, jsonManagerService }, e, { file }) => {
    try {
      const config = await dbManagerService.getAppConfig();
      if (config.profile.file === file) {
        return;
      }
      const k = await dbManagerService.getAppProfiles();
      const tmp = k.find((p) => p.file === file);
      if (!tmp) return;
      const profile = await jsonManagerService.loadFile(
        tmp.path,
        ProfileSchema,
      );
      const profiles = k.map((p) => ({
        name: p.name,
        file: p.file,
        active: p.file === file,
      }));
      await dbManagerService.updateAppConfigProfile(tmp.id || 1);
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
  async ({ dbManagerService, jsonManagerService }, e, { settings }) => {
    try {
      const config = await dbManagerService.getAppConfig();
      await jsonManagerService.updateFile(config.profile.path, ProfileSchema, {
        tts: settings,
      });
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
