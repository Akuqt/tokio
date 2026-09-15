import { APP_EVENTS } from "@/common/types";
import React from "react";
import { FiMonitor } from "react-icons/fi";
import { SettingsAction, SettingsState } from "../helper";
import styles from "../settings.module.css";

interface Props {
  store: SettingsState["store"];
  dispatch: React.Dispatch<SettingsAction>;
}

export function ServerSection({ store, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>
          <FiMonitor style={{ marginRight: "8px", verticalAlign: "middle" }} />{" "}
          Overlay Server
        </h2>
        <p className={styles.section_description}>
          Configure the local web server used for overlays.
        </p>
      </div>

      <div className={styles.server_container}>
        <label className={styles.checkbox_label}>
          <input
            type="checkbox"
            className={styles.server_check}
            checked={store.settings.server.enabled}
            onChange={(e) => {
              if (e.target.checked) {
                dispatch({ type: "setServerModal", payload: true });
              } else {
                dispatch({ type: "setServerEnabled", payload: false });
                window.api.emit(APP_EVENTS.SET_SERVER, {
                  enabled: false,
                });
              }
            }}
          />
          Enable Server
        </label>
      </div>
    </div>
  );
}
