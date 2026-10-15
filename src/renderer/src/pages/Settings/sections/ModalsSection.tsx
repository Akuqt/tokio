import { APP_EVENTS } from "@/common/types";
import { CustomSelect, Modal } from "@/components";
import React from "react";
import { SettingsAction, SettingsState } from "../helper";
import styles from "../settings.module.css";

interface Props {
  modal: SettingsState["modal"];
  newProfileName: SettingsState["newProfileName"];
  cloneProfile: SettingsState["cloneProfile"];
  store: SettingsState["store"];
  dispatch: React.Dispatch<SettingsAction>;
}

export function ModalsSection({
  modal,
  newProfileName,
  cloneProfile,
  store,
  dispatch,
}: Props) {
  return (
    <>
      {modal.type === "confirmServer" && modal.value && (
        <Modal
          title="Enable Overlay Server?"
          description="Starting the local overlay server will open the specified port on your network to allow OBS and other browser sources to connect. Are you sure you want to proceed?"
          onClose={() => dispatch({ type: "clearModal" })}
          onConfirm={() => {
            dispatch({ type: "setServerEnabled", payload: true });
            dispatch({ type: "clearModal" });
            window.api.emit(APP_EVENTS.REQ_FQDN);
          }}
          confirmText="Enable Server"
        />
      )}

      {modal.type === "newProfile" && modal.value && (
        <Modal
          title="Create New Profile"
          description="Enter a name for your new streamer profile. This will start with completely blank settings."
          onClose={() => dispatch({ type: "clearModal" })}
          onConfirm={() => {
            if (!newProfileName.trim()) return;
            dispatch({ type: "clearModal" });
            dispatch({ type: "setNewProfileName", payload: "" });
            window.api.emit(APP_EVENTS.CREATE_PROFILE, {
              name: newProfileName,
            });
          }}
          confirmText="Create Profile"
        >
          <label className={styles.label_title}>Profile Name</label>
          <input
            type="text"
            className={styles.input_style}
            placeholder="e.g. Chill Stream"
            value={newProfileName}
            onChange={(e) =>
              dispatch({ type: "setNewProfileName", payload: e.target.value })
            }
            autoFocus
          />
        </Modal>
      )}

      {modal.type === "cloneProfile" && modal.value && (
        <Modal
          title="Clone Existing Profile"
          description="Select an existing profile to copy its settings, and give the new clone a name."
          onClose={() => dispatch({ type: "clearModal" })}
          onConfirm={() => {
            if (!newProfileName.trim()) return;
            dispatch({ type: "clearModal" });
            dispatch({
              type: "setCloneProfile",
              payload: { name: "", referenceFile: "" },
            });
            window.api.emit(APP_EVENTS.CLONE_PROFILE, {
              name: newProfileName,
              ref: cloneProfile.referenceFile,
            });
          }}
          confirmText="Clone Profile"
        >
          <div>
            <label className={styles.label_title}>Profile to Clone</label>
            <CustomSelect
              value={cloneProfile.name}
              options={store.profiles.map((p: any) => ({
                label: p.name,
                value: p.file,
              }))}
              onChange={(val, lab) => {
                dispatch({
                  type: "setCloneProfile",
                  payload: {
                    name: lab || "Default",
                    referenceFile: val,
                  },
                });
              }}
            />
          </div>
          <div style={{ marginTop: "12px" }}>
            <label className={styles.label_title}>New Profile Name</label>
            <input
              type="text"
              className={styles.input_style}
              placeholder="e.g. Horror Stream Layout"
              value={newProfileName}
              onChange={(e) => {
                dispatch({
                  type: "setNewProfileName",
                  payload: e.target.value,
                });
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}
