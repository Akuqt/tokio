import { TIKTOK_EVENTS } from "@/common/types";
import { EventStack } from "@/common/util";
import { TikTokLiveConnector } from "@/connector";
import { cleanText } from "@/helper";
import { TTSService } from "@/tts";
import { AppHandlerVariables } from "@/types";
import { IpcMainEvent } from "electron";
import path from "path";

const events = new EventStack<AppHandlerVariables, IpcMainEvent>();

events.push<string>(
  "app:listener:start",
  async ({ connector, win, tts }, e, username) => {
    connector = new TikTokLiveConnector();
    tts = new TTSService();
    connector.on(TIKTOK_EVENTS.CONNECTED, () => {
      console.log("app:listener:done");
      e.reply("app:listener:done");
    });
    connector.on(TIKTOK_EVENTS.CHAT, async (chatData) => {
      if (chatData.user.username.includes("Ratku")) {
        const template = `${cleanText(chatData.user.username)} dice ${cleanText(chatData.comment.content)}`;
        console.log(template);
        const b64Audio = await tts?.getB64Filtered(
          path.resolve(__dirname, "../../bin/ffmpeg.exe"), // TODO: Replace this with the actual bin.
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
