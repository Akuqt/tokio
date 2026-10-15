import { Profile } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { SoundPicker } from "@/components";
import { useAlertTest, useAudio } from "@renderer/hooks";
import isEqual from "fast-deep-equal";
import { useEffect, useReducer, useRef } from "react";
import styles from "./alerts.module.css";
import { defaultState, reducer } from "./helper";
import { HeaderSection } from "./sections/HeaderSection";
import { ItemsSection } from "./sections/ItemsSection";

// Groups quick changes, like dragging a volume slider, into one save.
const SAVE_DELAY = 300;

export function Alerts() {
  const isInitialMount = useRef(true);
  // Settings changed but not sent to main yet
  const pendingSave = useRef<Profile["alerts"] | null>(null);

  const [state, dispatch] = useReducer(reducer, defaultState);

  const { setItemGain } = useAudio();
  const test = useAlertTest();

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      window.api.emit(APP_EVENTS.GET_PROFILE);
      window.api.emit(APP_EVENTS.GET_GIFTS);
    }

    const removeGetProfile = window.api.on(
      APP_EVENTS_RESPONSE.GET_PROFILE,
      (res) => {
        if (res?.success) {
          dispatch({ type: "initSettings", payload: res.profile!["alerts"] });
        }
      },
    );

    const removeGetGifts = window.api.on(
      APP_EVENTS_RESPONSE.GET_GIFTS,
      (res) => {
        if (res) dispatch({ type: "setGifts", payload: res.data });
      },
    );

    const removeUpdateAlertsSettings = window.api.on(
      APP_EVENTS_RESPONSE.UPDATE_ALERTS_SETTINGS,
      (res) => {
        // Resync with what is actually saved
        if (res && !res.success) window.api.emit(APP_EVENTS.GET_PROFILE);
      },
    );

    const removeSetAlertSound = window.api.on(
      APP_EVENTS_RESPONSE.SET_ALERT_SOUND,
      (res) => {
        if (res?.success && res.sound) {
          dispatch({
            type: "setAlertSound",
            payload: { id: res.id, sound: res.sound },
          });
          dispatch({ type: "setPickerFor", payload: null });
        }
      },
    );

    return () => {
      removeGetProfile();
      removeGetGifts();
      removeUpdateAlertsSettings();
      removeSetAlertSound();
    };
  }, []);

  useEffect(() => {
    if (isEqual(state.settings, state.settingsTemp)) return undefined;

    const settings = state.settings;
    pendingSave.current = settings;
    const timer = setTimeout(() => {
      window.api.emit(APP_EVENTS.UPDATE_ALERTS_SETTINGS, { settings });
      pendingSave.current = null;
      dispatch({ type: "setSettingsTemp", payload: settings });
    }, SAVE_DELAY);

    return () => clearTimeout(timer);
  }, [state.settings, state.settingsTemp]);

  // Apply volume changes to sounds that are already waiting or playing.
  useEffect(() => {
    state.settings.items.forEach((alert) => {
      setItemGain(alert.id, alert.volume / 100);
    });
  }, [state.settings.items]);

  // Don't lose a change made right before leaving the page.
  useEffect(() => {
    return () => {
      if (pendingSave.current) {
        window.api.emit(APP_EVENTS.UPDATE_ALERTS_SETTINGS, {
          settings: pendingSave.current,
        });
      }
    };
  }, []);

  return (
    <>
      <div className={styles.container}>
        <HeaderSection
          simultaneous={state.settings.simultaneous}
          queueLength={state.settings.queue_length}
          dispatch={dispatch}
        />
        <span className={styles.section_delimiter} />

        <ItemsSection
          items={state.settings.items}
          gifts={state.gifts}
          testing={test.testing}
          onTest={test.toggle}
          dispatch={dispatch}
        />
      </div>

      {state.pickerFor && (
        <SoundPicker
          id={state.pickerFor}
          testing={test.testing}
          onTest={test.toggle}
          onSelect={(sound) => {
            dispatch({
              type: "setAlertSound",
              payload: { id: state.pickerFor!, sound },
            });
            dispatch({ type: "setPickerFor", payload: null });
          }}
          onClose={() => dispatch({ type: "setPickerFor", payload: null })}
        />
      )}
    </>
  );
}
