import { APP_EVENTS } from "@/common/types";
import { CustomSelect } from "@/components";
import React from "react";
import { FiDownload, FiLayout, FiUpload } from "react-icons/fi";
import { SettingsAction, SettingsState } from "../helper";
import styles from "../settings.module.css";

interface Props {
  store: SettingsState["store"];
  mode: "dark" | "light";
  dispatch: React.Dispatch<SettingsAction>;
}

export function ThemeSection({ store, mode, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>
          <FiLayout style={{ marginRight: "8px", verticalAlign: "middle" }} />{" "}
          Themes
        </h2>
        <p className={styles.section_description}>
          Customize the look and feel of the application.
        </p>
      </div>

      <div className={styles.selects_container}>
        <div style={{ flex: 1 }}>
          <label className={styles.label_title}>Active Theme</label>
          <CustomSelect
            value={store.settings.activeTheme.name}
            onChange={(val) => {
              dispatch({ type: "setActiveTheme", payload: val });
              window.api.emit(APP_EVENTS.SET_THEME, { file: val, mode });
            }}
            options={store.themes.map((p: any) => ({
              label: p.name,
              value: p.file,
            }))}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            className={styles.action_btn}
            onClick={() =>
              window.api.emit(APP_EVENTS.IMPORT_ENTITY, { type: "theme" })
            }
          >
            <FiDownload /> Import
          </button>
          <button
            className={styles.action_btn}
            onClick={() => {
              window.api.emit(APP_EVENTS.EXPORT_ENTITY, {
                type: "theme",
                file: store.settings.activeTheme.file,
              });
            }}
          >
            <FiUpload /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
