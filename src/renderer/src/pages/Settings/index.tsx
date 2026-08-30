import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { useEffect, useReducer, useRef } from "react";
import { defaultState, reducer } from "./helper";
import { ModalsSection } from "./sections/ModalsSection";
import { ProfileSection } from "./sections/ProfileSection";
import { ProvidersSection } from "./sections/ProvidersSection";
import { ServerSection } from "./sections/ServerSection";
import styles from "./settings.module.css";

export function Settings() {
  const isInitialMount = useRef(true);
  const [
    {
      store,
      modal,
      cloneProfile,
      newTTSProvider,
      newProfileName,
      newConnProvider,
    },
    dispatch,
  ] = useReducer(reducer, defaultState);

  useEffect(() => {
    const removeGetSettings = window.api.on(
      APP_EVENTS_RESPONSE.GET_SETTINGS,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.data! });
        }
      },
    );
    const removeCreateProfile = window.api.on(
      APP_EVENTS_RESPONSE.CREATE_PROFILE,
      (res) => {
        if (res?.success) console.log("PROFILE CREATED");
      },
    );
    const removeCloneProfile = window.api.on(
      APP_EVENTS_RESPONSE.CLONE_PROFILE,
      (res) => {
        if (res?.success) console.log("PROFILE CLONED");
      },
    );
    const removeImportEntity = window.api.on(
      APP_EVENTS_RESPONSE.IMPORT_ENTITY,
      (res) => {
        if (res?.success) console.log("IMPORT COMPLETED", res.type);
      },
    );
    const removeExportEntity = window.api.on(
      APP_EVENTS_RESPONSE.EXPORT_ENTITY,
      (res) => {
        if (res?.success) console.log("EXPORT COMPLETED", res.type);
      },
    );
    const removeSetProvider = window.api.on(
      APP_EVENTS_RESPONSE.SET_PROVIDER,
      (res) => {
        if (res?.success) console.log("SET PROVIDER", res.type);
      },
    );
    const removeEnableServer = window.api.on(
      APP_EVENTS_RESPONSE.SET_SERVER,
      (res) => {
        if (res?.success) console.log("SET SERVER");
      },
    );
    const removeFQDN = window.api.on(APP_EVENTS_RESPONSE.REQ_FDQN, (res) => {
      dispatch({ type: "setServerEnabled", payload: res?.success || false });
    });

    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_SETTINGS);
    }

    return () => {
      removeGetSettings();
      removeCreateProfile();
      removeCloneProfile();
      removeImportEntity();
      removeExportEntity();
      removeSetProvider();
      removeEnableServer();
      removeFQDN();
    };
  }, []);

  return (
    <>
      <ModalsSection
        modal={modal}
        newProfileName={newProfileName}
        cloneProfile={cloneProfile}
        store={store}
        dispatch={dispatch}
      />

      <div className={styles.container}>
        <ServerSection store={store} dispatch={dispatch} />

        <span className={styles.section_delimiter} />

        <ProvidersSection
          store={store}
          newTTSProvider={newTTSProvider}
          newConnProvider={newConnProvider}
          dispatch={dispatch}
        />

        <span className={styles.section_delimiter} />

        <ProfileSection store={store} dispatch={dispatch} />
      </div>
    </>
  );
}
