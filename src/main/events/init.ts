import { ALERT_TRIGGERS } from "@/common/schemas";
import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  AppEvents,
  CustomGift,
  TOKIO_EVENTS,
  TokioEventMap,
} from "@/common/types";
import { formatError } from "@/common/util";
import config from "@/config";
import { createStack } from "@/helper/events";
import Logger from "@/logger";
import { AlertsService } from "@/services/alerts";
import { TikTokConnectorService } from "@/services/connector";
import { MusicService } from "@/services/music";
import { StoreManagerService } from "@/services/store";
import { TTSService } from "@/services/tts";
import { CustomBrowserWindow } from "@/types";
import { throttle } from "es-toolkit";

const STATS_THROTTLE_MS = 250;

const events = createStack();

// Gifts in the shape overlays use, none when TikTok can't be reached.
const fetchOverlayGifts = async (
  conn: TikTokConnectorService,
): Promise<CustomGift[]> => {
  const gifts = await conn.fetchGifts();
  if (!gifts.success) return [];
  return gifts.data.map((g) => ({
    value: g.id,
    label: g.name,
    img: g.image,
    coins: g.coins,
  }));
};

const registerConnectorEvents = (
  conn: TikTokConnectorService,
  win: CustomBrowserWindow,
  store: StoreManagerService,
  tts: TTSService,
  music: MusicService,
  alerts: AlertsService,
) => {
  const dispatchAlert = async <K extends AppEvents>(
    type: K,
    payload: TokioEventMap[K],
  ) => {
    if (!store.getActiveFeatures().alerts) return;
    const profile = await store.getProfileData();
    if (!profile) return;
    await alerts.handle(type, payload, profile.alerts, (audio) => {
      win.webContents.send(APP_EVENTS_RESPONSE.ALERT_AUDIO, audio);
    });
  };

  for (const trigger of ALERT_TRIGGERS) {
    const listener = (d: TokioEventMap[typeof trigger]) => {
      void dispatchAlert(trigger, d);
    };
    // MUSIC_CHANGE comes from the music service, the rest from the connector.
    if (trigger === TOKIO_EVENTS.MUSIC_CHANGE) {
      music.on(trigger, listener);
    } else {
      conn.on(trigger, listener);
    }
  }

  // Busy lives send many of these, the UI only needs the latest few a second.
  const sendViews = throttle((views: number, viewers: number) => {
    win.webContents.send(APP_EVENTS_RESPONSE.VIEWS, {
      data: { views, viewers },
    });
  }, STATS_THROTTLE_MS);
  const sendLikes = throttle((likes: number) => {
    win.webContents.send(APP_EVENTS_RESPONSE.LIKES, { likes });
  }, STATS_THROTTLE_MS);

  conn.on(TOKIO_EVENTS.ROOM_USER, (d) => {
    store.updateLiveStats({ viewers: d.viewers, views: d.views });
    sendViews(d.views, d.viewers);
  });
  conn.on(TOKIO_EVENTS.LIKE, (d) => {
    store.updateLiveStats({ likes: d.totalLikes });
    sendLikes(d.totalLikes);
  });
  conn.on(TOKIO_EVENTS.DISCONNECTED, () => {
    // A late stats update would overwrite the reset below.
    sendViews.cancel();
    sendLikes.cancel();
    music.clearHandler();
    tts.clearTalk();
    win.webContents.send(APP_EVENTS_RESPONSE.ALERT_CLEAR, undefined);
    win.webContents.send(APP_EVENTS_RESPONSE.CONNECTED, {
      success: false,
      stats: {
        likes: 0,
        viewers: 0,
        views: 0,
      },
    });
  });
  conn.on(TOKIO_EVENTS.CHAT, async (d) => {
    const features = store.getActiveFeatures();
    const profile = await store.getProfileData();
    if (features.tts) {
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
    if (features.music && music.isActive()) {
      if (!profile) return;
      music.handle(d, profile.music);
    } else {
      music.clearHandler();
    }
  });
};

events.push(
  APP_EVENTS.GET_PROFILE,
  async ({ storeManagerService, pathManagerService }, e) => {
    try {
      const profile = await storeManagerService.getProfileData();
      const profiles = storeManagerService.getProfiles();
      if (!profile || !profiles) throw new Error("Unable to load profile");

      e.reply(APP_EVENTS_RESPONSE.GET_PROFILE, {
        success: true,
        profile,
        profiles,
      });
    } catch (error) {
      Logger.error(
        `<System> Unable to get the profile -- ${formatError(error)}`,
        pathManagerService.files?.logs.system,
        error,
      );
      e.reply(APP_EVENTS_RESPONSE.GET_PROFILE, { success: false });
    }
  },
);

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
      overlayService,
      urlManagerService,
      jsonManagerService,
      yamlManagerService,
      alertsService,
      win,
    },
    e,
  ) => {
    try {
      await pathManagerService.initialize(
        app.getPath("home"),
        config.APP.folderName,
        ({ files, folders }) => {
          connectorService.setLogFile(files.logs.connector);
          ttsService.setLogFile(files.logs.tts);
          serverService.setLogFile(files.logs.server);
          overlayService.setLogFile(files.logs.overlays);
          urlManagerService.setLogFile(files.logs.system);
          storeManagerService.setLogFile(files.logs.system);
          jsonManagerService.setLogFile(files.logs.system);
          alertsService.setLogFile(files.logs.alerts);
          musicService.setLogFile(files.logs.music);
          alertsService.setSoundsFolder(folders.soundsFolder);
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
      overlayService.initialize(
        {
          folder: pathManagerService.folders.overlaysFolder,
          giftsFile: pathManagerService.files.gifts,
        },
        {
          yaml: yamlManagerService,
          json: jsonManagerService,
          server: serverService,
          store: storeManagerService,
        },
      );
      serverService.initEvents(connectorService, musicService);
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
        alertsService,
      );

      const settings = storeManagerService.getSettings();

      // Before the server starts, so it serves the overlays right away. The
      // gifts saved last time are used when there are any, so startup doesn't
      // wait for TikTok, and fresh ones replace them once they arrive.
      const cachedGifts = await overlayService.getGifts();
      if (cachedGifts.length > 0) {
        await overlayService.load(cachedGifts);
        void fetchOverlayGifts(connectorService)
          .then(async (gifts) => {
            if (gifts.length > 0) await overlayService.refreshGifts(gifts);
          })
          .catch((error) => {
            Logger.error(
              `<System> Unable to refresh the gifts -- ${formatError(error)}`,
              pathManagerService.files.logs.system,
              error,
            );
          });
      } else {
        await overlayService.load(await fetchOverlayGifts(connectorService));
      }

      // A taken port shouldn't stop the app, the server is turned off instead.
      if (!(await serverService.toggleServer(settings.server.enabled))) {
        Logger.warn(
          "<System> Unable to start the overlay server, it has been disabled.",
          pathManagerService.files.logs.system,
        );
        await storeManagerService.updateServerSettings(false);
      }

      win.setResizable(true);
      win.setSize(1200, 800);
      win.setMinimumSize(1200, 800);
      win.center();
      e.reply(APP_EVENTS_RESPONSE.LOAD_APP, {
        success: true,
      });
    } catch (error) {
      Logger.error(
        `<System> Unable to load the app -- ${formatError(error)}`,
        pathManagerService.files?.logs.system,
        error,
      );
      e.reply(APP_EVENTS_RESPONSE.LOAD_APP, { success: false });
    }
  },
);

export default events;
