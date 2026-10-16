import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { ReactNode, useEffect, useState } from "react";
import {
  VscChromeClose,
  VscChromeMaximize,
  VscChromeMinimize,
  VscChromeRestore,
} from "react-icons/vsc";
import styles from "./titlebar.module.css";

const WINDOW_EVENTS = {
  main: {
    minimize: APP_EVENTS.MINIMIZE_WINDOW,
    maximize: APP_EVENTS.MAXIMIZE_WINDOW,
    close: APP_EVENTS.CLOSE_WINDOW,
    resize: APP_EVENTS_RESPONSE.RESIZE_WINDOW,
  },
  music: {
    minimize: APP_EVENTS.MINIMIZE_MUSIC_WINDOW,
    maximize: APP_EVENTS.MAXIMIZE_MUSIC_WINDOW,
    close: APP_EVENTS.CLOSE_MUSIC_WINDOW,
    resize: APP_EVENTS_RESPONSE.RESIZE_MUSIC_WINDOW,
  },
} as const;

type Props = {
  // Which window the controls act on
  target: keyof typeof WINDOW_EVENTS;
  logo: string;
  // 40px tall instead of 56px, for the music window's nav view
  compact?: boolean;
  // Rendered before the window controls
  children?: ReactNode;
};

/**
 * Draggable window header with the logo and the minimize, maximize and close
 * controls.
 */
export function TitleBar({ target, logo, compact, children }: Props) {
  const events = WINDOW_EVENTS[target];
  const [maximized, setMaximized] = useState(false);

  useEffect(
    () =>
      window.api.on(events.resize, (res) => {
        if (res) setMaximized(res.state !== "normal");
      }),
    [events],
  );

  return (
    <header className={`${styles.bar} ${compact ? styles.compact : ""}`}>
      <div className={styles.logo}>
        <img src={logo} alt="都" />
      </div>
      <div className={styles.items}>
        {children}
        <div className={styles.controls}>
          <button
            className={styles.control}
            title="Minimize"
            onClick={() => window.api.emit(events.minimize)}
          >
            <VscChromeMinimize size={14} />
          </button>
          <button
            className={styles.control}
            title={maximized ? "Restore" : "Maximize"}
            onClick={() => window.api.emit(events.maximize)}
          >
            {maximized ? (
              <VscChromeRestore size={18} />
            ) : (
              <VscChromeMaximize size={14} />
            )}
          </button>
          <button
            className={`${styles.control} ${styles.close}`}
            title="Close"
            onClick={() => window.api.emit(events.close)}
          >
            <VscChromeClose size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
