import { Profile } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE, AppEventsMap } from "@/common/types";
import { defaultProfile } from "@/common/util";
import isEqual from "fast-deep-equal";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImmerState } from "./useImmerState";
import { useIpcListener } from "./useIpcListener";
import { useIpcRequest } from "./useIpcRequest";
import { useUnsavedChanges } from "./useUnsavedChanges";

const SAVE_EVENTS = {
  tts: {
    request: APP_EVENTS.UPDATE_TTS_SETTINGS,
    response: APP_EVENTS_RESPONSE.UPDATE_TTS_SETTINGS,
  },
  music: {
    request: APP_EVENTS.UPDATE_MUSIC_SETTINGS,
    response: APP_EVENTS_RESPONSE.UPDATE_MUSIC_SETTINGS,
  },
} as const;

type Section = keyof typeof SAVE_EVENTS;

/**
 * A section of the active profile, edited as a draft and saved by hand.
 * Unsaved changes are guarded: switching profile or leaving the page asks
 * the user first (see UnsavedProvider).
 */
export function useEditableSettings<K extends Section>(
  section: K,
  // Names the settings in the unsaved changes prompt
  label: string,
  // Called with the settings every time they're loaded
  onLoad?: (settings: Profile[K]) => void,
) {
  const [saved, setSaved] = useState<Profile[K]>(defaultProfile[section]);
  const [draft, update, setDraft] = useImmerState<Profile[K]>(
    defaultProfile[section],
  );

  const hasChanges = useMemo(() => !isEqual(saved, draft), [saved, draft]);

  useIpcRequest(APP_EVENTS.GET_PROFILE);

  // Also answers profile switches, which are confirmed before they happen.
  useIpcListener(APP_EVENTS_RESPONSE.GET_PROFILE, (res) => {
    if (!res?.success) return;
    const settings = res.profile![section];
    setSaved(settings);
    setDraft(settings);
    onLoad?.(settings);
  });

  // Read by the unsaved changes prompt, which outlives this render
  const latest = useRef({ saved, draft, hasChanges });
  useEffect(() => {
    latest.current = { saved, draft, hasChanges };
  });

  const save = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        const { request, response } = SAVE_EVENTS[section];
        const settings = latest.current.draft;

        const removeListener = window.api.on(response, (res) => {
          removeListener();
          if (res?.success) setSaved(settings);
          resolve(res?.success ?? false);
        });

        window.api.emit(request, {
          settings,
        } as AppEventsMap[typeof request]);
      }),
    [section],
  );

  const { register } = useUnsavedChanges();

  useEffect(
    () =>
      register({
        label,
        isDirty: () => latest.current.hasChanges,
        save,
        discard: () => setDraft(latest.current.saved),
      }),
    [register, label, save, setDraft],
  );

  return { draft, update, hasChanges, save };
}
