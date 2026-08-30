import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { useEffect, useState } from "react";
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import styles from "./assets/app.module.css";
import Logo from "./assets/logo_32.png?url";

export default function App() {
  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () =>
    window.api.emit(APP_EVENTS.MINIMIZE_MUSIC_WINDOW);
  const handleClose = () => window.api.emit(APP_EVENTS.CLOSE_MUSIC_WINDOW);
  const handleMaximize = () =>
    window.api.emit(APP_EVENTS.MAXIMIZE_MUSIC_WINDOW);

  useEffect(() => {
    const removeResize = window.api.on(
      APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW,
      (res) => {
        if (!res) return;
        if (res.state === "normal") {
          setIsMaximized(false);
        } else {
          setIsMaximized(true);
        }
      },
    );

    return () => {
      removeResize();
    };
  }, []);

  return (
    <header className={styles.nav}>
      <div className={styles.logo}>
        <img src={Logo} alt="都" />
      </div>
      <div className={styles.nav_top_items_container}>
        <div className={styles.window_controls_container}>
          <button
            onClick={handleMinimize}
            className={styles.window_control_min}
            title="Minimize"
          >
            <VscChromeMinimize size={14} />
          </button>

          <button
            onClick={handleMaximize}
            className={styles.window_control_max}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <VscChromeRestore size={18} />
            ) : (
              <VscChromeMaximize size={14} />
            )}
          </button>

          <button
            onClick={handleClose}
            className={styles.window_control_close}
            title="Close"
          >
            <VscChromeClose size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
