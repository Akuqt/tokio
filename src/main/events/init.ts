import { TIKTOK_EVENTS } from "@/common/types";
import { cleanText, createStack } from "@/helper";

const events = createStack();

events.push<string>(
  "app:listener:start",
  async ({ connector, win, tts }, e, username) => {
    connector.on(TIKTOK_EVENTS.CONNECTED, () => {
      e.reply("app:listener:done");
    });
    // NOTE: Testing TTS
    connector.on(TIKTOK_EVENTS.CHAT, async (chatData) => {
      const template = `${cleanText(chatData.user.username)} dice ${cleanText(chatData.comment.content)}`;
      console.log(template);
      const res = await tts.generateBuffer(template, "es", "Spanish MX - Male");
      if (!res.success || !res.buffer) return;
      const audio = new Uint8Array(res.buffer);
      win?.webContents.send("app:audio:data", audio);
    });
    await connector.connect(username);
  },
);

export default events;
