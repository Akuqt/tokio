import { APP_EVENTS } from "@/common/types";
import { CustomSelect } from "@/components";
import React from "react";
import { FiBox, FiSave } from "react-icons/fi";
import { SettingsAction, SettingsState } from "../helper";
import styles from "../settings.module.css";

interface Props {
  store: SettingsState["store"];
  newTTSProvider: SettingsState["newTTSProvider"];
  newConnProvider: SettingsState["newConnProvider"];
  dispatch: React.Dispatch<SettingsAction>;
}

export function ProvidersSection({
  store,
  newTTSProvider,
  newConnProvider,
  dispatch,
}: Props) {
  return (
    <div className={styles.section}>
      <div>
        <h2 className={styles.section_header}>
          <FiBox style={{ marginRight: "8px", verticalAlign: "middle" }} />{" "}
          Providers
        </h2>
        <p className={styles.section_description}>
          Configure the backend services used for TTS and TikTok events.
        </p>
      </div>

      <div className={styles.providers_container}>
        {/* TTS Provider */}
        <div className={styles.provider_container}>
          <div>
            <label className={styles.label_title}>TTS</label>
            <CustomSelect
              value={newTTSProvider.name}
              onChange={(val) => {
                dispatch({ type: "setNewTTSProviderName", payload: val });
              }}
              options={store.settings.providers.tts.map((p: any) => ({
                label: p.name,
                value: p.name,
              }))}
            />
          </div>
          <div>
            <label className={styles.label_title}>
              Key <span className={styles.secondary_text}>(Optional)</span>
            </label>
            <input
              type="password"
              placeholder="Provider key..."
              className={styles.input_style}
              value={newTTSProvider.key}
              onChange={(val) => {
                dispatch({
                  type: "setNewTTSProviderKey",
                  payload: val.target.value || "",
                });
              }}
            />
          </div>
          <button
            onClick={() => {
              window.api.emit(APP_EVENTS.SET_PROVIDER, {
                name: newTTSProvider.name,
                key: newTTSProvider.key,
                type: "tts",
              });
            }}
            className={styles.action_btn}
            style={{ alignSelf: "flex-start", marginTop: "4px" }}
          >
            <FiSave /> Save
          </button>
        </div>

        {/* Connector Provider */}
        <div className={styles.provider_container}>
          <div>
            <label className={styles.label_title}>TikTok Events</label>
            <CustomSelect
              value={newConnProvider.name}
              onChange={(val) => {
                dispatch({ type: "setNewConnProviderName", payload: val });
              }}
              options={store.settings.providers.connector.map((p: any) => ({
                label: p.name,
                value: p.name,
              }))}
            />
          </div>
          <div>
            <label className={styles.label_title}>
              Key <span className={styles.secondary_text}>(Optional)</span>
            </label>
            <input
              type="password"
              placeholder="Provider key..."
              className={styles.input_style}
              value={newConnProvider.key}
              onChange={(val) => {
                dispatch({
                  type: "setNewConnProviderKey",
                  payload: val.target.value || "",
                });
              }}
            />
          </div>
          <button
            onClick={() => {
              window.api.emit(APP_EVENTS.SET_PROVIDER, {
                name: newConnProvider.name,
                key: newConnProvider.key,
                type: "connector",
              });
            }}
            className={styles.action_btn}
            style={{ alignSelf: "flex-end", marginTop: "4px" }}
          >
            <FiSave /> Save
          </button>
        </div>
      </div>
    </div>
  );
}
