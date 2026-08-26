import { mergeStacks } from "@/helper/events";
import init from "./init";
import home from "./pages/home";
import settings from "./pages/settings";
import tts from "./pages/tts";

export default mergeStacks(init, settings, tts, home);
