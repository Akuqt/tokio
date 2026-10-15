import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { PermissionsSection } from "@/components";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { FiSave } from "react-icons/fi";
import { defaultState, reducer } from "./helper";
import styles from "./music.module.css";
import { ControlsSection } from "./sections/ControlsSection";
import { ProtectionSection } from "./sections/ProtectionSection";
import { ProviderSection } from "./sections/ProviderSection";

export function Music() {
  const isInitialMount = useRef(true);

  const [
    {
      settings,
      blacklistTemp,
      settingsTemp,
      whitelistTemp,
      connected,
      loading,
    },
    dispatch,
  ] = useReducer(reducer, defaultState);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_PROFILE);
      window.api.emit(APP_EVENTS.IS_MUSIC_CONNECTED);
    }

    const removeGetProfile = window.api.on(
      APP_EVENTS_RESPONSE.GET_PROFILE,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.profile!["music"] });
        }
      },
    );

    const removeUpdateMusicSettings = window.api.on(
      APP_EVENTS_RESPONSE.UPDATE_MUSIC_SETTINGS,
      (res) => {
        if (res?.success) {
          window.api.emit(APP_EVENTS.GET_PROFILE);
        }
      },
    );

    const removeMusicConnected = window.api.on(
      APP_EVENTS_RESPONSE.MUSIC_CONNECTED,
      (res) => {
        dispatch({ type: "setConnected", payload: res?.success ?? false });
        dispatch({ type: "setLoading", payload: false });
      },
    );

    return () => {
      removeGetProfile();
      removeUpdateMusicSettings();
      removeMusicConnected();
    };
  }, []);

  const hasChanges = useMemo(() => {
    return !isEqual(settings, settingsTemp);
  }, [settings, settingsTemp]);

  return (
    <>
      <div className={styles.floating_save}>
        <button
          className={styles.floating_save_btn}
          onClick={() => {
            window.api.emit(APP_EVENTS.UPDATE_MUSIC_SETTINGS, {
              settings,
            });
          }}
          style={{
            opacity: hasChanges ? 1 : 0,
            pointerEvents: hasChanges ? "all" : "none",
            cursor: hasChanges ? "pointer" : "none",
          }}
          disabled={!hasChanges}
        >
          <FiSave size={30} />
        </button>
      </div>

      <div className={styles.container}>
        <ProviderSection
          dispatch={dispatch}
          provider={settings.provider}
          connected={connected}
          loading={loading}
          onConnect={() => {
            dispatch({ type: "setLoading", payload: true });
            window.api.emit(APP_EVENTS.UPDATE_MUSIC_SETTINGS, { settings });
            if (!connected) {
              window.api.emit(APP_EVENTS.CONNECT_MUSIC, {
                ...settings.provider,
              });
            } else {
              window.api.emit(APP_EVENTS.DISCONNECT_MUSIC);
            }
          }}
        />

        <span className={styles.section_delimiter} />

        <ControlsSection dispatch={dispatch} controls={settings.constrols} />

        <span className={styles.section_delimiter} />

        <PermissionsSection
          feature="Music"
          permissions={settings.permissions}
          whitelistTemp={whitelistTemp}
          blacklistTemp={blacklistTemp}
          dispatch={dispatch}
        />

        <span className={styles.section_delimiter} />

        <ProtectionSection
          protection={settings.protection}
          dispatch={dispatch}
        />
      </div>
    </>
  );
}
