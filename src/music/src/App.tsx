import { TitleBar } from "@/ui/TitleBar";
import Logo from "./assets/logo_32.png?url";

export default function App() {
  return <TitleBar target="music" logo={Logo} compact />;
}
