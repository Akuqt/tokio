import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  TOKIO_EVENTS,
  TokioEventMap,
} from "@/common/types";
import { createStack } from "@/helper/events";

const events = createStack();

events.push(
  APP_EVENTS.CONNECT,
  async ({ storeManagerService, connectorService }, e, { username }) => {
    try {
      await storeManagerService.updateProfileData({
        connector: {
          username,
        },
      });
      const stats = storeManagerService.getSettings().liveStats;
      // Answers this connect only, so connects don't pile up listeners.
      const onConnected = (d: TokioEventMap[TOKIO_EVENTS.CONNECTED]) => {
        connectorService.off(TOKIO_EVENTS.CONNECTED, onConnected);
        e.reply(APP_EVENTS_RESPONSE.CONNECTED, {
          success: d.success,
          stats,
        });
      };
      connectorService.on(TOKIO_EVENTS.CONNECTED, onConnected);
      await connectorService.connect(username);
    } catch {
      e.reply(APP_EVENTS_RESPONSE.CONNECTED, {
        stats: {
          likes: 0,
          viewers: 0,
          views: 0,
        },
        success: false,
      });
    }
  },
);

events.push(APP_EVENTS.DISCONNECT, async ({ connectorService }, e) => {
  try {
    await connectorService.disconnect();
  } catch {
    // NEXT
  }
  e.reply(APP_EVENTS_RESPONSE.CONNECTED, {
    success: false,
    stats: {
      likes: 0,
      viewers: 0,
      views: 0,
    },
  });
});

events.push(
  APP_EVENTS.IS_CONNECTED,
  async ({ connectorService, storeManagerService }, e) => {
    try {
      const res = connectorService.isConnected();
      const stats = storeManagerService.getSettings().liveStats;

      e.reply(APP_EVENTS_RESPONSE.CONNECTED, {
        stats,
        success: res,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.CONNECTED, {
        success: false,
        stats: {
          likes: 0,
          viewers: 0,
          views: 0,
        },
      });
    }
  },
);

events.push(
  APP_EVENTS.ACTIVE_FEATURES,
  async ({ storeManagerService, win }, _, data) => {
    try {
      storeManagerService.updateActiveFeatures({
        ...data,
      });
      if (data.alerts === false) {
        win.webContents.send(APP_EVENTS_RESPONSE.ALERT_CLEAR, undefined);
      }
    } catch {
      // Next
    }
  },
);

export default events;
