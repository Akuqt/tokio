import { APP_EVENTS, APP_EVENTS_RESPONSE, TIKTOK_EVENTS } from "@/common/types";
import config from "@/config";
import { createStack } from "@/helper/events";
import { TikTokConnectorService } from "@/services/connector";
import { MusicService } from "@/services/music";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { CustomBrowserWindow } from "@/types";
import { join } from "path";
import { processHTML, processOverlay } from "./helper";

const events = createStack();

const registerConnectorEvents = (
  conn: TikTokConnectorService,
  win: CustomBrowserWindow,
  store: StoreManagerService,
  tts: TTSService,
  music: MusicService,
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
    const profile = await store.getProfileData();
    if (settings.activeFeatures.tts) {
      if (!profile) return;
      tts.talk(d, profile.tts, (res) => {
        win.webContents.send(APP_EVENTS_RESPONSE.TTS_AUDIO, {
          data: res.data!,
          filters: res.filters,
          queueOptions: res.queueOptions,
        });
      });
    } else {
      tts.clearTalk();
    }
    if (settings.activeFeatures.music && music.isActive()) {
      if (!profile) return;
      music.handle(d, profile.music);
    } else {
      music.clearHandler();
    }
  });
};

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
      musicService,
      serverService,
      urlManagerService,
      jsonManagerService,
      yamlManagerService,
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
        musicService,
      );

      const settings = storeManagerService.getSettings();

      const gifts = await connectorService.fetchGifts();

      let gifts_data = !gifts.success
        ? []
        : gifts.data.map((g) => ({
            value: g.id,
            label: g.name,
            img: g.image,
            coins: g.coins,
          }));

      await jsonManagerService.saveArbitraryFile(
        pathManagerService.files.gifts,
        gifts_data,
      );

      for (const overlay of settings.overlays) {
        const dir = join(pathManagerService.folders.overlaysFolder, overlay.id);
        const res = await processOverlay(
          dir,
          yamlManagerService,
          overlay.external!,
        );

        if (!res.success) {
          await storeManagerService.removeOverlayInfo(overlay.id);
        } else {
          const html = await processHTML(
            overlay.id,
            res.data!.htmlContent,
            dir,
            "value",
            res.data!.config,
            gifts_data,
          );

          if (!html.success) {
            await storeManagerService.removeOverlayInfo(overlay.id);
          }
          serverService.addOverlayApp(
            { ...res.data!.info, id: overlay.id, path: dir },
            false,
          );
        }
      }

      const serverRes = await serverService.toggleServer(
        settings.server.enabled,
      );

      if (!serverRes) throw new Error("Unable to start server");

      win.setResizable(true);
      win.setSize(1200, 800);
      win.setMinimumSize(1200, 800);
      win.center();
      e.reply(APP_EVENTS_RESPONSE.LOAD_APP, {
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.LOAD_APP, { success: false });
    }
  },
);

export default events;
