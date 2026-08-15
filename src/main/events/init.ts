import { ThemeSchema } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { createStack } from "@/helper/events";
import { join } from "path";

const events = createStack();

events.push(
  APP_EVENTS.GET_THEME,
  async (
    {
      storeManagerService,
      jsonManagerService,
      nativeTheme,
      pathManagerService,
    },
    e,
  ) => {
    try {
      const config = storeManagerService.getSettings();
      let mode: "dark" | "light" = "dark";
      if (config.theme_mode == "system") {
        if (!nativeTheme.shouldUseDarkColors) {
          mode = "light";
        }
      } else {
        mode = config.theme_mode;
      }
      const file = config.activeTheme.file;
      const theme = await jsonManagerService.loadFile(
        join(pathManagerService.folders.themesFolder, file),
        ThemeSchema,
      );
      if (!theme) throw new Error("Unable to load theme.");
      e.reply(APP_EVENTS_RESPONSE.GET_THEME, {
        success: true,
        theme,
        mode,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.GET_THEME, { success: false });
    }
  },
);

events.push(
  APP_EVENTS.SET_THEME_MODE,
  async ({ storeManagerService }, _, { mode }) => {
    try {
      await storeManagerService.updateAppearance(mode);
    } catch {
      // next
    }
  },
);

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

export default events;
