import { Profile, ProfileSchema, ThemeSchema } from "@/common/schemas";
import { THEME_MODE, TIKTOK_EVENTS } from "@/common/types";
import { cleanText, createStack } from "@/helper";

const events = createStack();

events.push<string>(
  "app:listener:start",
  async ({ connectorService, win, ttsService }, e, username) => {
    connectorService.on(TIKTOK_EVENTS.CONNECTED, () => {
      e.reply("app:listener:done");
    });
    // NOTE: Testing TTS
    connectorService.on(TIKTOK_EVENTS.CHAT, async (chatData) => {
      const template = `${cleanText(chatData.user.username)} dice ${cleanText(chatData.comment.content)}`;
      console.log(template);
      const res = await ttsService.generateBuffer(
        template,
        "es",
        "Spanish MX - Male",
      );
      if (!res.success || !res.buffer) return;
      const audio = new Uint8Array(res.buffer);
      win?.webContents.send("app:audio:data", audio);
    });
    await connectorService.connect(username);
  },
);

events.push(
  "app:get:theme",
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
      e.reply("app:res:theme", {
        success: true,
        theme,
        mode,
      });
    } catch {
      e.reply("app:res:theme", { success: false });
    }
  },
);

events.push(
  "app:get:profile",
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
      e.reply("app:res:profile", {
        success: true,
        profile,
        profiles,
      });
    } catch {
      e.reply("app:res:profile", { success: false });
    }
  },
);

events.push<{ file: string }>(
  "app:set:profile",
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
      e.reply("app:res:profile", {
        success: true,
        profile,
        profiles,
      });
    } catch {
      // Next
    }
  },
);

events.push("app:get:services", async ({ ttsService, connectorService }, e) => {
  try {
    const ttsProviders = ttsService
      .getProviders()
      .map((p) => ({ ...p, type: "tts" }));
    const connProviders = connectorService
      .getProviders()
      .map((p) => ({ ...p, type: "connector" }));

    e.reply("app:res:services", {
      services: [...ttsProviders, ...connProviders],
      success: true,
    });
  } catch {
    e.reply("app:res:services", { success: false });
  }
});

events.push("app:get:voices", async ({ ttsService }, e) => {
  try {
    const voices = ttsService.getVoices();
    e.reply("app:res:voices", {
      voices,
      success: true,
    });
  } catch {
    e.reply("app:res:voices", { success: false });
  }
});

events.push<{ name: string; type: "tts" | "connector"; key?: string }>(
  "app:set:services",
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
      e.reply("app:res:services", {
        services: [...ttsProviders, ...connProviders],
        success: true,
      });
    } catch {
      // Next
    }
  },
);

events.push<{ settings: Profile["tts"] }>(
  "app:update:tts:profile",
  async ({ dbManagerService, jsonManagerService }, e, { settings }) => {
    try {
      const config = await dbManagerService.getAppConfig();
      await jsonManagerService.updateFile(config.profile.path, ProfileSchema, {
        tts: settings,
      });
      e.reply("app:update:res:tts:profile", {
        success: true,
      });
    } catch {
      e.reply("app:update:res:tts:profile", {
        success: false,
      });
    }
  },
);

export default events;
