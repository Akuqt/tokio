import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { cleanText } from "@/helper/chat";
import { createStack } from "@/helper/events";
import { dialog } from "electron";

const events = createStack();

events.push(APP_EVENTS.GET_SETTINGS, ({ storeManagerService }, e) => {
  try {
    const settings = storeManagerService.getSettings();
    const profiles = storeManagerService.getProfiles();

    e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
      data: {
        settings,
        profiles,
      },
      success: true,
    });
  } catch {
    e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
      success: false,
    });
  }
});

events.push(
  APP_EVENTS.CREATE_PROFILE,
  async ({ storeManagerService }, e, { name }) => {
    try {
      const fileName = cleanText(name).replace(/\s/, "_") + ".json";
      const res = await storeManagerService.createNewProfile(fileName, name);
      if (!res) throw new Error("Failed to create Profile.");
      const settings = storeManagerService.getSettings();
      const profiles = storeManagerService.getProfiles();

      e.reply(APP_EVENTS_RESPONSE.CREATE_PROFILE, {
        success: true,
      });
      e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
        data: {
          settings,
          profiles,
        },
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.CREATE_PROFILE, {
        success: false,
      });
    }
  },
);

events.push(
  APP_EVENTS.CLONE_PROFILE,
  async ({ storeManagerService }, e, { name, ref }) => {
    try {
      const fileName = cleanText(name).replace(/\s/, "_") + ".json";
      const res = await storeManagerService.cloneProfile(ref, fileName, name);
      if (!res) throw new Error("Failed to clone Profile.");

      const settings = storeManagerService.getSettings();
      const profiles = storeManagerService.getProfiles();

      e.reply(APP_EVENTS_RESPONSE.CLONE_PROFILE, {
        success: true,
      });
      e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
        data: {
          settings,
          profiles,
        },
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.CLONE_PROFILE, {
        success: false,
      });
    }
  },
);

events.push(
  APP_EVENTS.SET_PROFILE,
  async ({ storeManagerService }, e, { file }) => {
    try {
      await storeManagerService.updateActiveProfile(file);
      const profile = await storeManagerService.getProfileData();
      const settings = storeManagerService.getSettings();
      const profiles = storeManagerService.getProfiles();
      if (!profile || !profiles) throw new Error("Unable to load profile");
      e.reply(APP_EVENTS_RESPONSE.GET_PROFILE, {
        success: true,
        profile,
        profiles,
      });

      e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
        data: {
          settings,
          profiles,
        },
        success: true,
      });
    } catch {
      // Next
    }
  },
);

events.push(
  APP_EVENTS.EXPORT_ENTITY,
  async ({ storeManagerService, win }, e, { type, file }) => {
    try {
      const diagRes = await dialog.showSaveDialog(win, {
        title: `Export ${type}`,
        defaultPath: file,
        filters: [
          {
            extensions: ["json"],
            name: type,
          },
        ],
      });
      if (diagRes.canceled) return;
      let res = false;
      if (type === "profile") {
        res = await storeManagerService.exportProfile(file, diagRes.filePath);
      } else {
        res = false;
      }

      if (!res) throw new Error("Failed to export Entity.");

      e.reply(APP_EVENTS_RESPONSE.EXPORT_ENTITY, {
        success: true,
        type,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.EXPORT_ENTITY, {
        success: false,
        type,
      });
    }
  },
);

events.push(
  APP_EVENTS.IMPORT_ENTITY,
  async ({ storeManagerService, win }, e, { type }) => {
    try {
      const diagRes = await dialog.showOpenDialog(win, {
        title: `Import ${type}`,
        properties: ["openFile"],
        filters: [
          {
            extensions: ["json"],
            name: type,
          },
        ],
      });
      if (diagRes.canceled) return;
      let res = false;
      if (type === "profile") {
        res = await storeManagerService.importProfile(diagRes.filePaths[0]);
      } else {
        res = false;
      }

      if (!res) throw new Error("Failed to import Entity.");

      const settings = storeManagerService.getSettings();
      const profiles = storeManagerService.getProfiles();

      e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
        data: {
          settings,
          profiles,
        },
        success: true,
      });

      e.reply(APP_EVENTS_RESPONSE.IMPORT_ENTITY, {
        success: true,
        type,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.IMPORT_ENTITY, {
        success: false,
        type,
      });
    }
  },
);

events.push(
  APP_EVENTS.SET_PROVIDER,
  async ({ storeManagerService, ttsService }, e, { name, key, type }) => {
    try {
      const switched =
        type === "tts" && ttsService.getActiveProvider()?.name !== name;
      await storeManagerService.updateProvider(type, name, key);
      if (switched) {
        // Voices are provider specific, reset the profile to the new provider's default.
        const voice = await ttsService.getDefaultVoice();
        const profile = await storeManagerService.getProfileData();
        if (voice && profile) {
          await storeManagerService.updateProfileData({
            tts: { ...profile.tts, voice },
          });
        }
      }
      const settings = storeManagerService.getSettings();
      const profiles = storeManagerService.getProfiles();

      e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
        data: {
          settings,
          profiles,
        },
        success: true,
      });
      e.reply(APP_EVENTS_RESPONSE.SET_PROVIDER, {
        type,
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.SET_PROVIDER, {
        type,
        success: false,
      });
    }
  },
);

events.push(
  APP_EVENTS.SET_SERVER,
  async ({ storeManagerService, serverService }, e, { enabled }) => {
    try {
      await storeManagerService.updateServerSettings(enabled);
      const res = await serverService.toggleServer(enabled);
      if (!res) throw new Error("Unable to start server");
      const settings = storeManagerService.getSettings();
      const profiles = storeManagerService.getProfiles();

      e.reply(APP_EVENTS_RESPONSE.GET_SETTINGS, {
        data: {
          settings,
          profiles,
        },
        success: true,
      });
      e.reply(APP_EVENTS_RESPONSE.SET_SERVER, {
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.SET_SERVER, {
        success: false,
      });
    }
  },
);

events.push(APP_EVENTS.REQ_FDQN, async ({ urlManagerService }, e) => {
  try {
    const res = await urlManagerService.installAppFQDN();
    e.reply(APP_EVENTS_RESPONSE.REQ_FDQN, {
      success: res,
    });
  } catch {
    e.reply(APP_EVENTS_RESPONSE.REQ_FDQN, {
      success: false,
    });
  }
});

export default events;
