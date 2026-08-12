import { APP_EVENTS } from "@/common/types";
import { ProfileDropdown } from "@/components";
import { useAudio, useProfile, useTheme } from "@/hooks";
import { Link, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FiHome, FiMoon, FiSettings, FiSun, FiVolume2 } from "react-icons/fi";
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import styles from "./layout.module.css";

export function Layout() {
  const { mode, toggleMode } = useTheme();
  const { profiles, changeProfile } = useProfile();
  const { resumeContext } = useAudio();

  const [isMaximized, setIsMaximized] = useState(false);

  const handleMinimize = () => window.api.emit(APP_EVENTS.MINIMIZE_WINDOW);
  const handleClose = () => window.api.emit(APP_EVENTS.CLOSE_WINDOW);
  const handleMaximize = () => window.api.emit(APP_EVENTS.MAXIMIZE_WINDOW);

  useEffect(() => {
    const removeResize = window.api.on(APP_EVENTS.RESIZE_WINDOW, (res) => {
      if (!res) return;
      if (res.state === "normal") {
        setIsMaximized(false);
      } else {
        setIsMaximized(true);
      }
    });
    resumeContext();
    return () => {
      removeResize();
    };
  }, []);

  return (
    <div className={styles.container}>
      <header className={styles.nav}>
        <div className={styles.logo}>T</div>
        <div className={styles.nav_top_items_container}>
          <div
            className={styles.theme_mode_toggle}
            onClick={toggleMode}
            title="Toggle Theme"
          >
            {mode === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
          </div>

          <ProfileDropdown
            profiles={profiles}
            onProfileSelected={changeProfile}
          />

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

      <div className={styles.main_area_container}>
        <nav className={styles.sidebar}>
          <Link
            to="/"
            className={styles.sidebar_item}
            activeProps={{
              style: {
                color: "var(--side-bar-items-selected)",
                fontWeight: "bold",
              },
            }}
          >
            <FiHome size={22} />
            Home
          </Link>

          <Link
            to="/tts"
            className={styles.sidebar_item}
            activeProps={{
              style: {
                color: "var(--side-bar-items-selected)",
                fontWeight: "bold",
              },
            }}
          >
            <FiVolume2 size={22} />
            TTS
          </Link>

          <Link
            to="/settings"
            className={styles.sidebar_item}
            style={{ marginTop: "auto" }}
            activeProps={{
              style: {
                color: "var(--side-bar-items-selected)",
                fontWeight: "bold",
              },
            }}
          >
            <FiSettings size={22} />
            Settings
          </Link>
        </nav>

        <main className={styles.main_content_container}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
