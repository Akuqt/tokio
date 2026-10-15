import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { createStack } from "@/helper/events";
import { dialog } from "electron";

const events = createStack();

events.push(
  APP_EVENTS.IMPORT_OVERLAY,
  async ({ win, overlayService }, e, { gifts }) => {
    try {
      const diagRes = await dialog.showOpenDialog(win, {
        title: `Import Overlay`,
        properties: ["openDirectory"],
      });
      if (diagRes.canceled) return;

      const res = await overlayService.import(diagRes.filePaths[0], gifts);

      e.reply(APP_EVENTS_RESPONSE.IMPORT_OVERLAY, { success: res.success });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.IMPORT_OVERLAY, { success: false });
    }
  },
);

events.push(APP_EVENTS.GET_OVERLAYS, async ({ overlayService }, e) => {
  e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
    success: true,
    data: overlayService.getOverlays(),
  });
});

events.push(
  APP_EVENTS.GET_OVERLAY_CONFIG,
  async ({ overlayService }, e, { id }) => {
    e.reply(
      APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG,
      await overlayService.getConfig(id),
    );
  },
);

events.push(APP_EVENTS.GET_GIFTS, async ({ overlayService }, e) => {
  e.reply(APP_EVENTS_RESPONSE.GET_GIFTS, {
    data: await overlayService.getGifts(),
  });
});

events.push(
  APP_EVENTS.SAVE_OVERLAY_CONFIG,
  async ({ overlayService }, e, { config, gifts, id }) => {
    const res = await overlayService.saveConfig(id, config, gifts);
    e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, {
      success: res.success,
      data: res.data,
      id: res.success ? id : undefined,
    });
  },
);

events.push(
  APP_EVENTS.SEND_OVERLAY_DATA,
  async ({ overlayService }, _, { id, payload }) => {
    overlayService.send(id, payload);
  },
);

events.push(APP_EVENTS.TEST_OVERLAY, async ({ overlayService }, e, { id }) => {
  e.reply(APP_EVENTS_RESPONSE.TEST_OVERLAY, {
    payloads: overlayService.getTestPayloads(),
    id,
  });
});

export default events;
