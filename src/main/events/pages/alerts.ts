import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { createStack } from "@/helper/events";
import { AUDIO_EXTENSIONS } from "@/services/alerts";
import { dialog } from "electron";

const events = createStack();

events.push(
  APP_EVENTS.UPDATE_ALERTS_SETTINGS,
  async ({ storeManagerService }, e, { settings }) => {
    try {
      const res = await storeManagerService.updateProfileData({
        alerts: settings,
      });
      e.reply(APP_EVENTS_RESPONSE.UPDATE_ALERTS_SETTINGS, { success: res });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.UPDATE_ALERTS_SETTINGS, { success: false });
    }
  },
);

events.push(
  APP_EVENTS.SEARCH_SOUNDS,
  async ({ alertsService }, e, { query, page }) => {
    const res = query?.trim()
      ? await alertsService.search(query.trim(), page)
      : await alertsService.getTrending(page);

    e.reply(APP_EVENTS_RESPONSE.SEARCH_SOUNDS, {
      success: res.success,
      query: query ?? "",
      page,
      data: res.data?.sounds ?? [],
      hasNextPage: res.data?.hasNextPage ?? false,
    });
  },
);

events.push(
  APP_EVENTS.DOWNLOAD_SOUND,
  async ({ alertsService }, e, { id, url, name }) => {
    const res = await alertsService.downloadSound(url, name);
    e.reply(APP_EVENTS_RESPONSE.SET_ALERT_SOUND, {
      success: res.success,
      id,
      sound: res.data,
    });
  },
);

events.push(
  APP_EVENTS.IMPORT_SOUND,
  async ({ win, alertsService, storeManagerService }, e, { id }) => {
    const diagRes = await dialog.showOpenDialog(win, {
      title: "Select a sound",
      properties: ["openFile"],
      filters: [{ name: "Audio", extensions: AUDIO_EXTENSIONS }],
    });
    if (diagRes.canceled || !diagRes.filePaths[0]) return;

    const res = await alertsService.importSound(diagRes.filePaths[0]);
    // Uploads also go to the sound library.
    if (res.data) await storeManagerService.addSound(res.data);
    e.reply(APP_EVENTS_RESPONSE.SET_ALERT_SOUND, {
      success: res.success,
      id,
      sound: res.data,
    });
  },
);

events.push(APP_EVENTS.TEST_ALERT, async ({ alertsService }, e, data) => {
  const res =
    "url" in data
      ? await alertsService.fetchSound(data.url)
      : await alertsService.readSound(data.file);

  e.reply(APP_EVENTS_RESPONSE.TEST_ALERT, {
    success: res.success,
    id: data.id,
    data: res.data,
    volume: data.volume,
  });
});

events.push(APP_EVENTS.GET_SOUNDS, ({ storeManagerService }, e) => {
  try {
    e.reply(APP_EVENTS_RESPONSE.GET_SOUNDS, {
      success: true,
      data: storeManagerService.getSounds(),
    });
  } catch {
    e.reply(APP_EVENTS_RESPONSE.GET_SOUNDS, { success: false, data: [] });
  }
});

events.push(
  APP_EVENTS.UPLOAD_SOUNDS,
  async ({ win, alertsService, storeManagerService }, e) => {
    const diagRes = await dialog.showOpenDialog(win, {
      title: "Upload sounds",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Audio", extensions: AUDIO_EXTENSIONS }],
    });
    if (diagRes.canceled) return;

    let success = true;
    for (const path of diagRes.filePaths) {
      const res = await alertsService.importSound(path);
      if (res.data) await storeManagerService.addSound(res.data);
      else success = false;
    }

    e.reply(APP_EVENTS_RESPONSE.GET_SOUNDS, {
      success,
      data: storeManagerService.getSounds(),
    });
  },
);

events.push(
  APP_EVENTS.REMOVE_SOUND,
  async ({ alertsService, storeManagerService }, e, { file }) => {
    let success = true;
    try {
      await storeManagerService.removeSound(file);
      // Alerts that already use the sound keep working.
      if (!(await storeManagerService.isSoundInUse(file))) {
        success = (await alertsService.deleteSound(file)).success;
      }
    } catch {
      success = false;
    }

    e.reply(APP_EVENTS_RESPONSE.GET_SOUNDS, {
      success,
      data: storeManagerService.getSounds(),
    });
  },
);

export default events;
