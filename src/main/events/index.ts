import { mergeStacks } from "@/helper/events";
import init from "./init";
import alerts from "./pages/alerts";
import home from "./pages/home";
import music from "./pages/music";
import overlays from "./pages/overlays";
import settings from "./pages/settings";
import tools from "./pages/tools";
import tts from "./pages/tts";

export default mergeStacks(
  init,
  settings,
  tts,
  home,
  music,
  overlays,
  alerts,
  tools,
);
