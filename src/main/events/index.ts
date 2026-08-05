import { mergeStacks } from "@/helper";
import init from "./init";
import welcome from "./pages/welcome";

export default mergeStacks(init, welcome);
