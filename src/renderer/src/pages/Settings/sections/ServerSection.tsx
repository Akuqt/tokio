import { APP_EVENTS } from "@/common/types";
import React from "react";
import { FiMonitor, FiSave } from "react-icons/fi";
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
              }
            }}
          />
          Enable Server
        </label>

        <div className={styles.port_container}>
          <div className={styles.label_port}>
            <label className={styles.port_label}>Port</label>
            <input
              type="number"
              className={styles.input_style}
              style={{
                width: "100px",
                justifySelf: "start",
                opacity: store.settings.server.enabled ? 1 : 0.5,
                pointerEvents: store.settings.server.enabled ? "auto" : "none",
              }}
              value={store.settings.server.port}
              onChange={(e) => {
                dispatch({
                  type: "setServerPort",
                  payload: parseInt(e.target.value) || 6767,
                });
              }}
              disabled={!store.settings.server.enabled}
            />
          </div>
          <button
            onClick={() => {
              window.api.emit(APP_EVENTS.SET_SERVER, {
                enabled: store.settings.server.enabled,
                port: store.settings.server.port,
              });
            }}
            className={styles.action_btn}
          >
            <FiSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
