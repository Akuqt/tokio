import { OverlayConfigSchema } from "@/common/schemas";
import {
  APP_EVENTS,
  APP_EVENTS_RESPONSE,
  CustomGift,
  TOKIO_EVENTS,
  TokioPayload,
} from "@/common/types";
import { generateTikTokEventSample } from "@/common/util";
import { createStack } from "@/helper/events";
import { dialog } from "electron";
import { randomUUID } from "node:crypto";
import { cp } from "node:fs/promises";
import { join } from "node:path";
import { processHTML, processOverlay } from "../helper";

const events = createStack();

events.push(
  APP_EVENTS.IMPORT_OVERLAY,
  async (
    {
      win,
      serverService,
      yamlManagerService,
      pathManagerService,
      storeManagerService,
    },
    e,
    { gifts },
  ) => {
    try {
      const diagRes = await dialog.showOpenDialog(win, {
        title: `Import Overlay`,
        properties: ["openDirectory"],
      });
      if (diagRes.canceled) return;

      const basedir = diagRes.filePaths[0];

      const res = await processOverlay(basedir, yamlManagerService, true);

      if (!res.success) {
        e.reply(APP_EVENTS_RESPONSE.IMPORT_OVERLAY, {
          success: false,
        });
        return;
      }

      const { config, htmlContent, info } = res.data!;

      const id = randomUUID();

      const newDir = join(pathManagerService.folders.overlaysFolder, id);

      await cp(basedir, newDir, {
        recursive: true,
      });

      const htmlRes = await processHTML(
        id,
        htmlContent,
        newDir,
        "default",
        config,
        gifts,
      );

      if (!htmlRes.success) {
        e.reply(APP_EVENTS_RESPONSE.IMPORT_OVERLAY, {
          success: false,
        });
        return;
      }

      serverService.addOverlayApp(
        {
          ...info,
          path: newDir,
          id,
        },
        true,
      );

      await storeManagerService.addOverlayInfo({ ...info, id });

      e.reply(APP_EVENTS_RESPONSE.IMPORT_OVERLAY, {
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.IMPORT_OVERLAY, { success: false });
    }
  },
);

events.push(APP_EVENTS.GET_OVERLAYS, async ({ serverService }, e) => {
  try {
    const apps = serverService.getOverlayApps();

    e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, {
      success: true,
      data: apps.map((ov) => ({ ...ov, path: join(ov.path, "index.html") })),
    });
  } catch {
    e.reply(APP_EVENTS_RESPONSE.GET_OVERLAYS, { success: false });
  }
});

events.push(
  APP_EVENTS.GET_OVERLAY_CONFIG,
  async ({ pathManagerService, yamlManagerService }, e, { id }) => {
    try {
      const dir = join(pathManagerService.folders.overlaysFolder, id);

      const res = await processOverlay(dir, yamlManagerService, false);

      e.reply(APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG, {
        success: res.success,
        data: res.data?.config,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.GET_OVERLAY_CONFIG, { success: false });
    }
  },
);

events.push(
  APP_EVENTS.GET_GIFTS,
  async ({ jsonManagerService, pathManagerService }, e) => {
    try {
      const res = await jsonManagerService.loadArbitraryFile<CustomGift[]>(
        pathManagerService.files.gifts,
      );

      e.reply(APP_EVENTS_RESPONSE.GET_GIFTS, {
        data: res ?? [],
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.GET_GIFTS, { data: [] });
    }
  },
);

events.push(
  APP_EVENTS.SAVE_OVERLAY_CONFIG,
  async (
    { pathManagerService, yamlManagerService },
    e,
    { config, gifts, id },
  ) => {
    try {
      const dir = join(pathManagerService.folders.overlaysFolder, id);
      const res = await processOverlay(dir, yamlManagerService, false);

      if (!res.success) {
        e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, {
          success: false,
        });
        return;
      }

      const { htmlContent } = res.data!;

      const htmlRes = await processHTML(
        id,
        htmlContent,
        dir,
        "value",
        config,
        gifts,
      );

      if (!htmlRes.success) {
        e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, {
          success: false,
        });
        return;
      }

      const resSave = await yamlManagerService.saveFile(
        res.paths!.config,
        OverlayConfigSchema,
        config,
      );

      if (!resSave) {
        e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, {
          success: false,
        });
        return;
      }

      e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, {
        success: true,
        data: htmlRes.parsed,
        id,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.SAVE_OVERLAY_CONFIG, { success: false });
    }
  },
);

events.push(
  APP_EVENTS.SEND_OVERLAY_DATA,
  async ({ serverService }, _, { id, payload }) => {
    try {
      serverService.sendToClient(id, payload);
    } catch {
      // Next
    }
  },
);

events.push(APP_EVENTS.TEST_OVERLAY, async (_, e, { id }) => {
  const payloads: TokioPayload[] = [];
  for (const key of Object.values(TOKIO_EVENTS)) {
    if (
      key === TOKIO_EVENTS.CONNECTED ||
      key === TOKIO_EVENTS.DISCONNECTED ||
      key === TOKIO_EVENTS.MUSIC_PROCCESS_ENDED
    ) {
      continue;
    }
    payloads.push(generateTikTokEventSample(key));
  }

  e.reply(APP_EVENTS_RESPONSE.TEST_OVERLAY, {
    payloads,
    id,
  });
});

export default events;
