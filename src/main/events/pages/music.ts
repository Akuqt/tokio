import { APP_EVENTS, APP_EVENTS_RESPONSE, MUSIC_EVENTS } from "@/common/types";
import { createStack } from "@/helper/events";

const events = createStack();

events.push(
  APP_EVENTS.UPDATE_MUSIC_SETTINGS,
  async ({ storeManagerService }, e, { settings }) => {
    try {
      const res = await storeManagerService.updateProfileData({
        music: settings,
      });
      e.reply(APP_EVENTS_RESPONSE.UPDATE_MUSIC_SETTINGS, {
        success: res,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.UPDATE_MUSIC_SETTINGS, {
        success: false,
      });
    }
  },
);

events.push(
  APP_EVENTS.CONNECT_MUSIC,
  async ({ musicService, ipcMain }, e, { name, key }) => {
    try {
      musicService.on(MUSIC_EVENTS.PROCCESS_ENDED, () => {
        e.reply(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, {
          success: false,
        });
      });

      if (musicService.isActive()) {
        musicService.disconnect();
      }

      musicService.setProvider(name, key);

      const res = await musicService.connect(ipcMain);

      e.reply(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, {
        success: res.success,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, {
        success: false,
      });
    }
  },
);

events.push(APP_EVENTS.IS_MUSIC_CONNECTED, ({ musicService }, e) => {
  let conn = false;
  try {
    conn = musicService.isActive();
  } catch {
    // Next
  }
  e.reply(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, {
    success: conn,
  });
});

events.push(APP_EVENTS.DISCONNECT_MUSIC, ({ musicService }, e) => {
  try {
    musicService.disconnect();
  } catch {
    // Next
  }
  e.reply(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, {
    success: false,
  });
});

export default events;
