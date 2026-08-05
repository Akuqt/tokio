import { TIKTOK_EVENTS } from "@/common/types";
import { cleanText, createStack } from "@/helper";

const events = createStack();

events.push<string>(
  "app:listener:start",
  async ({ connector, win, tts, files }, e, username) => {
    connector.on(TIKTOK_EVENTS.CONNECTED, () => {
      e.reply("app:listener:done");
    });
    connector.on(TIKTOK_EVENTS.CHAT, async (chatData) => {
      if (chatData.user.username.includes("Ratku")) {
        const template = `${cleanText(chatData.user.username)} dice ${cleanText(chatData.comment.content)}`;
        console.log(template);
        const b64Audio = await tts?.getB64Filtered(
          files.ffmpeg,
          template,
          "es",
          "Spanish MX - Male",
          { speed: 1, pitch: 1.0, volume: 1 },
        );
        win?.webContents.send("app:audio:data", b64Audio);
      }
    });
    await connector.connect(username);
  },
);

export default events;
