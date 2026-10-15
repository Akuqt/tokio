import { APP_EVENTS } from "@/common/types";
import { CustomSelect } from "@/components";
import React from "react";
import { FiCopy, FiDownload, FiPlus, FiUpload, FiUsers } from "react-icons/fi";
import { SettingsAction, SettingsState } from "../helper";
import styles from "../settings.module.css";

interface Props {
  store: SettingsState["store"];
  dispatch: React.Dispatch<SettingsAction>;
}

export function ProfileSection({ store, dispatch }: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>
          <FiUsers style={{ marginRight: "8px", verticalAlign: "middle" }} />{" "}
          Live Profiles
        </h2>
        <p className={styles.section_description}>
          Manage settings for different lives.
        </p>
      </div>

      <div className={styles.selects_container}>
        <div style={{ flex: 1 }}>
          <label className={styles.label_title}>Active Profile</label>
          <CustomSelect
            value={store.settings.activeProfile.name}
            onChange={(val) => {
              dispatch({ type: "setActiveProfile", payload: val });
              window.api.emit(APP_EVENTS.SET_PROFILE, { file: val });
            }}
            options={store.profiles.map((p: any) => ({
              label: p.name,
              value: p.file,
            }))}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() =>
              dispatch({ type: "setNewProfileModal", payload: true })
            }
            className={styles.action_btn}
            title="Create New Profile"
          >
            <FiPlus /> New
          </button>
          <button
            onClick={() =>
              dispatch({ type: "setCloneProfileModal", payload: true })
            }
            className={styles.action_btn}
            title="Clone Current Profile"
          >
            <FiCopy /> Clone
          </button>
          <button
            className={styles.action_btn}
            onClick={() =>
              window.api.emit(APP_EVENTS.IMPORT_ENTITY, { type: "profile" })
            }
          >
            <FiDownload /> Import
          </button>
          <button
            className={styles.action_btn}
            onClick={() => {
              window.api.emit(APP_EVENTS.EXPORT_ENTITY, {
                type: "profile",
                file: store.settings.activeProfile.file,
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
