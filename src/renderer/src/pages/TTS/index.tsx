import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { defaultProfile } from "@/common/util";
import { useAudio } from "@renderer/hooks";
import isEqual from "fast-deep-equal";
import { useEffect, useMemo, useReducer, useRef } from "react";
import { FiSave } from "react-icons/fi";
import { reducer } from "./helper";
import { FormatSection } from "./sections/FormatSection";
import { PermissionsSection } from "./sections/PermissionsSection";
import { ProtectionSection } from "./sections/ProtectionSection";
import { ReplacementsSection } from "./sections/ReplacementsSection";
import { VoiceSection } from "./sections/VoiceSection";
import styles from "./tts.module.css";

export function TTS() {
  const isInitialMount = useRef(true);

  const { getQueue } = useAudio();

  const ttsTestQueue = getQueue("tts_test");

  const [state, dispatch] = useReducer(reducer, {
    settings: defaultProfile["tts"],
    settingsTemp: defaultProfile["tts"],
    voices: [],
    testMSG: "",
    bannedlistTemp: "",
    blacklistTemp: "",
    whitelistTemp: "",
    testLoading: false,
  });

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_VOICES);
      window.api.emit(APP_EVENTS.GET_PROFILE);
    }

    const removeGetVoices = window.api.on(
      APP_EVENTS_RESPONSE.GET_VOICES,
      (res) => {
        if (res?.success) dispatch({ type: "setVoices", payload: res.voices! });
      },
    );

    const removeGetProfile = window.api.on(
      APP_EVENTS_RESPONSE.GET_PROFILE,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.profile!["tts"] });
          ttsTestQueue.setFilters({
            pitch: res.profile!["tts"].filters.pitch,
            speed: res.profile!["tts"].filters.speed,
            volume: res.profile!["tts"].filters.volume / 100,
          });
        }
      },
    );

    const removeUpdateTTSSettings = window.api.on(
      APP_EVENTS_RESPONSE.UPDATE_TTS_SETTINGS,
      (res) => {
        if (res?.success) {
          window.api.emit(APP_EVENTS.GET_PROFILE);
        }
      },
    );

    const removeGetTTSTest = window.api.on(
      APP_EVENTS_RESPONSE.GET_TTS_TEST,
      (res) => {
        if (res?.success) {
          dispatch({ type: "setTestLoading", payload: false });
          ttsTestQueue.enqueue(res.data!, true);
        }
      },
    );

    return () => {
      removeGetProfile();
      removeGetVoices();
      removeUpdateTTSSettings();
      removeGetTTSTest();
    };
  }, [ttsTestQueue]);

  const hasChanges = useMemo(() => {
    return !isEqual(state.settings, state.settingsTemp);
  }, [state.settings, state.settingsTemp]);

  return (
    <>
      <div className={styles.floating_save}>
        <button
          className={styles.floating_save_btn}
          onClick={() => {
            window.api.emit(APP_EVENTS.UPDATE_TTS_SETTINGS, {
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
        <VoiceSection
          settings={state.settings}
          voices={state.voices}
          testMSG={state.testMSG}
          testLoading={state.testLoading}
          dispatch={dispatch}
          ttsTestQueue={ttsTestQueue}
        />

        <FormatSection format={state.settings.format} dispatch={dispatch} />

        <PermissionsSection
          permissions={state.settings.permissions}
          whitelistTemp={state.whitelistTemp}
          blacklistTemp={state.blacklistTemp}
          dispatch={dispatch}
        />

        <ProtectionSection
          protection={state.settings.protection}
          bannedlistTemp={state.bannedlistTemp}
          dispatch={dispatch}
        />

        <ReplacementsSection
          replacements={state.settings.replacements}
          dispatch={dispatch}
        />
      </div>
    </>
  );
}
