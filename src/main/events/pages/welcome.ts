import config from "@/config";
import { createStack, downloadItem } from "@/helper";
import { existsSync } from "node:fs";

const events = createStack();

events.push(
  "pages:welcome:download:ffmpeg",
  async ({ files, internet, win }, e) => {
    if (existsSync(files.ffmpeg)) {
      e.reply("pages:welcome:download:ffmpeg:done", { ok: true });
      return;
    }
    if (!internet) {
      e.reply("pages:welcome:download:ffmpeg:done", {
        ok: false,
        msg: "No internet access.",
      });
      return;
    }
    await downloadItem(
      win,
      config.BIN.ffmpeg,
      files.ffmpeg,
      async () => {
        e.reply("pages:welcome:download:ffmpeg:done", { ok: true });
      },
      (_, state, webContents, item) => {
        if (state === "progressing") {
          const progress =
            (item.getReceivedBytes() / item.getTotalBytes()) * 100;
          webContents.send("pages:welcome:download:ffmpeg:progress", progress);
        }
      },
    );
  },
);

export default events;
