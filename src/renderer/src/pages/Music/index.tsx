import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { defaultProfile } from "@/common/util";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { FiSave } from "react-icons/fi";
import { reducer } from "./helper";
import styles from "./music.module.css";
import { ControlsSection } from "./sections/ControlsSection";
import { PermissionsSection } from "./sections/PermissionsSection";

export function Music() {
  const isInitialMount = useRef(true);

  const [state, dispatch] = useReducer(reducer, {
    settings: defaultProfile["music"],
    settingsTemp: defaultProfile["music"],
    blacklistTemp: "",
    whitelistTemp: "",
  });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_VOICES);
      window.api.emit(APP_EVENTS.GET_PROFILE);
    }

    const removeGetProfile = window.api.on(
      APP_EVENTS_RESPONSE.GET_PROFILE,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.profile!["music"] });
        }
      },
    );

    const removeUpdateTTSSettings = window.api.on(
      APP_EVENTS_RESPONSE.UPDATE_MUSIC_SETTINGS,
      (res) => {
        if (res?.success) {
          window.api.emit(APP_EVENTS.GET_PROFILE);
        }
      },
    );

    return () => {
      removeGetProfile();
      removeUpdateTTSSettings();
    };
  }, []);

  const hasChanges = useMemo(() => {
    return !isEqual(state.settings, state.settingsTemp);
  }, [state.settings, state.settingsTemp]);

  return (
    <>
      <div className={styles.floating_save}>
        <button
          className={styles.floating_save_btn}
          onClick={() => {
            window.api.emit(APP_EVENTS.UPDATE_MUSIC_SETTINGS, {
              settings: state.settings,
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
        <ControlsSection />
        <span className={styles.section_delimiter} />

        <PermissionsSection
          permissions={state.settings.permissions}
          whitelistTemp={state.whitelistTemp}
          blacklistTemp={state.blacklistTemp}
          dispatch={dispatch}
        />

        <span className={styles.section_delimiter} />
      </div>
    </>
  );
}
