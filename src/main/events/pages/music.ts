import { APP_EVENTS, APP_EVENTS_RESPONSE, TOKIO_EVENTS } from "@/common/types";
import { createStack } from "@/helper/events";

const events = createStack();

// The listener of the last connect, replaced on every connect.
let onMusicEnded: (() => void) | null = null;

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
  async ({ musicService }, e, { name, key }) => {
    try {
      if (onMusicEnded) {
        musicService.off(TOKIO_EVENTS.MUSIC_PROCCESS_ENDED, onMusicEnded);
      }
      onMusicEnded = () => {
        e.reply(APP_EVENTS_RESPONSE.MUSIC_CONNECTED, {
          success: false,
        });
      };
      musicService.on(TOKIO_EVENTS.MUSIC_PROCCESS_ENDED, onMusicEnded);

      if (musicService.isActive()) {
        musicService.disconnect();
      }

      musicService.setProvider(name, key);

      const res = await musicService.connect();

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
