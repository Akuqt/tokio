import { ThemeSchema } from "@/common/schemas";
import { THEME_MODE, TIKTOK_EVENTS } from "@/common/types";
import { cleanText, createStack } from "@/helper";

const events = createStack();

events.push<string>(
  "app:listener:start",
  async ({ connectorService, win, ttsService }, e, username) => {
    connectorService.on(TIKTOK_EVENTS.CONNECTED, () => {
      e.reply("app:listener:done");
    });
    // NOTE: Testing TTS
    connectorService.on(TIKTOK_EVENTS.CHAT, async (chatData) => {
      const template = `${cleanText(chatData.user.username)} dice ${cleanText(chatData.comment.content)}`;
      console.log(template);
      const res = await ttsService.generateBuffer(
        template,
        "es",
        "Spanish MX - Male",
      );
      if (!res.success || !res.buffer) return;
      const audio = new Uint8Array(res.buffer);
      win?.webContents.send("app:audio:data", audio);
    });
    await connectorService.connect(username);
  },
);

events.push(
  "app:get:theme",
  async ({ dbManagerService, jsonManagerService, nativeTheme }, e) => {
    try {
      const config = await dbManagerService.getAppConfig();
      let mode = "dark";
      if (config.theme_mode == THEME_MODE.SYSTEM) {
        if (!nativeTheme.shouldUseDarkColors) {
          mode = "light";
        }
      } else {
        mode = config.theme_mode;
      }
      const path = config.theme.path;
      const theme = await jsonManagerService.loadFile(path, ThemeSchema);
      e.reply("app:res:theme", {
        success: true,
        theme,
        mode,
      });
    } catch {
      e.reply("app:res:theme", { success: false });
    }
  },
);

export default events;
