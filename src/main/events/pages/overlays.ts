import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  FEEDBACK_CODES,
} from "@/common/types";
import { createStack, replyFailure } from "@/helper/events";
import { LoggedError } from "@/helper/feedback";
import { dialog } from "electron";

const events = createStack("overlays");

events.push(
  APP_EVENTS.IMPORT_OVERLAY,
  async ({ win, overlayService, notifier }, e) => {
    const diagRes = await dialog.showOpenDialog(win, {
      title: `Import Overlay`,
      properties: ["openDirectory"],
    });
    if (diagRes.canceled) return;

    const gifts = await overlayService.getGifts();
    const res = await overlayService.import(diagRes.filePaths[0], gifts);
    if (!res.success) {
      throw new Error(`${diagRes.filePaths[0]} is not a valid overlay.`);
    }

    e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
      success: true,
      data: overlayService.getOverlays(),
    });
    notifier.success(
      "overlays",
      FEEDBACK_CODES.OVERLAY_IMPORTED,
      "Overlay imported.",
    );
  },
  {
    failure: {
      code: FEEDBACK_CODES.OVERLAY_IMPORT_FAILED,
      message:
        "Unable to import the overlay. Check that the folder has an index.html and an info.yaml.",
    },
    onError: (e, error, _, { overlayService }) =>
      e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
        success: false,
        data: overlayService.getOverlays(),
        error,
      }),
  },
);

events.push(
  APP_EVENTS.REMOVE_OVERLAY,
  async ({ overlayService, notifier }, e, { id }) => {
    const res = await overlayService.remove(id);
    if (!res.success) throw new LoggedError(`Unable to remove overlay ${id}.`);

    e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
      success: true,
      data: overlayService.getOverlays(),
    });
    notifier.success(
      "overlays",
      FEEDBACK_CODES.OVERLAY_REMOVED,
      "Overlay removed.",
    );
  },
  {
    failure: {
      code: FEEDBACK_CODES.OVERLAY_REMOVE_FAILED,
      message: "Unable to remove the overlay.",
    },
    onError: (e, error, _, { overlayService }) =>
      e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
        success: false,
        data: overlayService.getOverlays(),
        error,
      }),
  },
);

events.push(
  APP_EVENTS.GET_OVERLAYS,
  async ({ overlayService }, e) => {
    e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
      success: true,
      data: overlayService.getOverlays(),
    });
  },
  {
    failure: {
      code: FEEDBACK_CODES.OVERLAYS_LOAD_FAILED,
      message: "Unable to load the overlays.",
    },
    onError: replyFailure(APP_EVENTS_RESPONSE.GET_OVERLAYS),
  },
);

events.push(
  APP_EVENTS.GET_OVERLAY_CONFIG,
  async ({ overlayService }, e, { id }) => {
    const res = await overlayService.getConfig(id);
    if (!res.success) throw new Error(`Unable to read overlay ${id}.`);
    e.reply(APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG, res);
  },
  {
    failure: {
      code: FEEDBACK_CODES.OVERLAY_CONFIG_FAILED,
      message: "Unable to load the overlay's settings.",
    },
    onError: replyFailure(APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG),
  },
);

events.push(
  APP_EVENTS.GET_GIFTS,
  async ({ overlayService }, e) => {
    e.reply(APP_EVENTS_RESPONSE.GET_GIFTS, {
      data: await overlayService.getGifts(),
    });
  },
  {
    failure: {
      code: FEEDBACK_CODES.GIFTS_FETCH_FAILED,
      message: "Unable to load the gifts.",
    },
    onError: (e) => e.reply(APP_EVENTS_RESPONSE.GET_GIFTS, { data: [] }),
  },
);

events.push(
  APP_EVENTS.SAVE_OVERLAY_CONFIG,
  async ({ overlayService, notifier }, e, { config, gifts, id }) => {
    const res = await overlayService.saveConfig(id, config, gifts);
    if (!res.success) throw new Error(`Unable to save overlay ${id}.`);
    e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, {
      success: true,
      data: res.data,
      id,
    });
    notifier.success(
      "overlays",
      FEEDBACK_CODES.OVERLAY_SAVED,
      "Overlay settings saved.",
    );
  },
  {
    failure: {
      code: FEEDBACK_CODES.OVERLAY_SAVE_FAILED,
      message: "Unable to save the overlay's settings.",
    },
    onError: replyFailure(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG),
  },
);

events.push(
  APP_EVENTS.SEND_OVERLAY_DATA,
  async ({ overlayService }, _, { id, payload }) => {
    overlayService.send(id, payload);
  },
  {
    failure: {
      code: FEEDBACK_CODES.OVERLAY_SEND_FAILED,
      message: "Unable to send the data to the overlay.",
    },
  },
);

events.push(
  APP_EVENTS.TEST_OVERLAY,
  async ({ overlayService }, e, { id }) => {
    e.reply(APP_EVENTS_RESPONSE.TEST_OVERLAY, {
      payloads: overlayService.getTestPayloads(),
      id,
    });
  },
  {
    failure: {
      code: FEEDBACK_CODES.TEST_OVERLAY_FAILED,
      message: "Unable to test the overlay.",
    },
    onError: (e, _, { id }) =>
      e.reply(APP_EVENTS_RESPONSE.TEST_OVERLAY, { payloads: [], id }),
  },
);

export default events;
