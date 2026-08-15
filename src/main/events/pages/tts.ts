import { ProfileSchema } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { createStack } from "@/helper/events";
import { join } from "path";

const events = createStack();

events.push(APP_EVENTS.GET_VOICES, async ({ ttsService }, e) => {
  try {
    const voices = ttsService.getVoices();
    e.reply(APP_EVENTS_RESPONSE.GET_VOICES, {
      voices,
      success: true,
    });
  } catch {
    e.reply(APP_EVENTS_RESPONSE.GET_VOICES, { success: false });
  }
});

events.push(
  APP_EVENTS.UPDATE_TTS_SETTINGS,
  async (
    { storeManagerService, jsonManagerService, pathManagerService },
    e,
    { settings },
  ) => {
    try {
      const config = storeManagerService.getSettings();

      await jsonManagerService.updateFile(
        join(
          pathManagerService.folders.profilesFolder,
          config.activeProfile.file,
        ),
        ProfileSchema,
        {
          tts: settings,
        },
      );
      e.reply(APP_EVENTS_RESPONSE.UPDATE_TTS_SETTINGS, {
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.UPDATE_TTS_SETTINGS, {
        success: false,
      });
    }
  },
);

events.push(
  APP_EVENTS.GET_TTS_TEST,
  async ({ ttsService }, e, { text, voice }) => {
    try {
      const res = await ttsService.generateBuffer(text, voice.lang, voice.name);
      if (!res.success || !res.buffer) {
        e.reply(APP_EVENTS_RESPONSE.GET_TTS_TEST, {
          success: false,
        });
        return;
      }
      const audio = new Uint8Array(res.buffer);
      e.reply(APP_EVENTS_RESPONSE.GET_TTS_TEST, {
        data: audio,
        success: true,
      });
    } catch {
      e.reply(APP_EVENTS_RESPONSE.GET_TTS_TEST, {
        success: false,
      });
    }
  },
);

export default events;
