import { mergeStacks } from "@/helper/events";
import init from "./init";
import home from "./pages/home";
import music from "./pages/music";
import settings from "./pages/settings";
import tts from "./pages/tts";

export default mergeStacks(init, settings, tts, home, music);
