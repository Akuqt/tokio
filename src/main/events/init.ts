import { ThemeSchema } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE, TIKTOK_EVENTS } from "@/common/types";
import { delay } from "@/common/util";
import config from "@/config";
import { createStack } from "@/helper/events";
import { TikTokConnectorService } from "@/services/connector";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { CustomBrowserWindow } from "@/types";
import { join } from "path";

const events = createStack();

const registerConnectorEvents = (
  conn: TikTokConnectorService,
  win: CustomBrowserWindow,
  store: StoreManagerService,
  tts: TTSService,
) => {
  conn.on(TIKTOK_EVENTS.ROOM_USER, (d) => {
    store.updateLiveStats({ viewers: d.viewers, views: d.views });
    win.webContents.send(APP_EVENTS_RESPONSE.VIEWS, {
      data: {
        views: d.views,
        viewers: d.viewers,
      },
    });
  });
  conn.on(TIKTOK_EVENTS.LIKE, (d) => {
    store.updateLiveStats({ likes: d.totalLikes });
    win.webContents.send(APP_EVENTS_RESPONSE.LIKES, {
      likes: d.totalLikes,
    });
  });
  conn.on(TIKTOK_EVENTS.DISCONNECTED, () => {
    win.webContents.send(APP_EVENTS_RESPONSE.CONNECTED, {
      success: false,
      stats: {
        likes: 0,
        viewers: 0,
        views: 0,
      },
    });
  });
  conn.on(TIKTOK_EVENTS.CHAT, async (d) => {
    const settings = store.getSettings();
    if (settings.activeFeatures.tts) {
      const profile = await store.getProfileData();
      if (!profile) return;
      const ttsSettings = profile.tts;
      tts.talk(d, ttsSettings, (res) => {
        win.webContents.send(APP_EVENTS_RESPONSE.TTS_AUDIO, {
          data: res.data!,
          filters: res.filters,
          queueOptions: res.queueOptions,
        });
      });
    } else {
      tts.clearTalk();
    }
  });
};

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
      let mode: "dark" | "light" = "dark";
      if (config.theme_mode == "system") {
        if (!nativeTheme.shouldUseDarkColors) {
          mode = "light";
        }
      } else {
        mode = config.theme_mode;
      }
      const file = config.activeTheme.file;
      const theme = await jsonManagerService.loadFile(
        join(pathManagerService.folders.themesFolder, file),
        ThemeSchema,
      );
      if (!theme) throw new Error("Unable to load theme.");
      e.reply(APP_EVENTS_RESPONSE.GET_THEME, {
        success: true,
        theme,
        mode,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.GET_THEME, { success: false });
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

events.push(APP_EVENTS.GET_PROFILE, async ({ storeManagerService }, e) => {
  try {
    const profile = await storeManagerService.getProfileData();
    const profiles = storeManagerService.getProfiles();
    if (!profile || !profiles) throw new Error("Unable to load profile");

    e.reply(APP_EVENTS_RESPONSE.GET_PROFILE, {
      success: true,
      profile,
      profiles,
    });
  } catch {
    e.reply(APP_EVENTS_RESPONSE.GET_PROFILE, { success: false });
  }
});

events.push(
  APP_EVENTS.LOAD_APP,
  async (
    {
      app,
      storeManagerService,
      pathManagerService,
      connectorService,
      ttsService,
      serverService,
      urlManagerService,
      jsonManagerService,
      nativeTheme,
      win,
    },
    e,
  ) => {
    try {
      await pathManagerService.initialize(
        app.getPath("home"),
        config.APP.folderName,
        ({ files }) => {
          connectorService.setLogFile(files.logs.connector);
          ttsService.setLogFile(files.logs.tts);
          serverService.setLogFile(files.logs.server);
          urlManagerService.setLogFile(files.logs.system);
          storeManagerService.setLogFile(files.logs.system);
          jsonManagerService.setLogFile(files.logs.system);
        },
      );
      await storeManagerService.initialize(
        config.DB.name,
        {
          connector: connectorService,
          tts: ttsService,
        },
        jsonManagerService,
        pathManagerService,
      );
      serverService.initEvents(connectorService);
      storeManagerService.updateLiveStats({
        likes: 0,
        viewers: 0,
        views: 0,
      });
      registerConnectorEvents(
        connectorService,
        win,
        storeManagerService,
        ttsService,
      );
      const settings = storeManagerService.getSettings();
      let mode: "dark" | "light" = "dark";
      if (settings.theme_mode == "system") {
        if (!nativeTheme.shouldUseDarkColors) {
          mode = "light";
        }
      } else {
        mode = settings.theme_mode;
      }
      const file = settings.activeTheme.file;
      const theme = await jsonManagerService.loadFile(
        join(pathManagerService.folders.themesFolder, file),
        ThemeSchema,
      );
      if (!theme) throw new Error("Unable to load theme.");
      await delay(3000); // NOTE: JUST TO SHOW THE SPLASH SCREEN lol
      win.setResizable(true);
      win.setSize(1200, 800);
      win.setMinimumSize(1200, 800);
      win.center();
      e.reply(APP_EVENTS_RESPONSE.LOAD_APP, {
        success: true,
        data: {
          theme: {
            data: theme,
            mode,
          },
        },
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.LOAD_APP, { success: false });
    }
  },
);

export default events;
