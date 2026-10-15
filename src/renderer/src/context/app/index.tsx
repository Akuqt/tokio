import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { SplashScreen } from "@/splash";
import { useAudio } from "@renderer/hooks";
import React, { createContext, useEffect, useRef, useState } from "react";

interface AppContextType {
  appLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isInitialMount = useRef(true);
  const [appLoading, setAppLoading] = useState(true);

  const { getQueue, stopQueues } = useAudio();

  const ttsQueue = getQueue("tts_data");

  useEffect(() => {
    if (!window.api) {
      setAppLoading(false);
      return;
    }

    const removeLoadApp = window.api.on(APP_EVENTS_RESPONSE.LOAD_APP, () => {
      setAppLoading(false);
    });

    const removeTTSData = window.api.on(
      APP_EVENTS_RESPONSE.TTS_AUDIO,
      (res) => {
        if (res) {
          ttsQueue.setQueueOptions(res.queueOptions);
          ttsQueue.setFilters({
            ...res.filters,
            volume: res.filters.volume / 100,
          });
          ttsQueue.enqueue(res.data!, true);
        }
      },
    );

    const removeAlertAudio = window.api.on(
      APP_EVENTS_RESPONSE.ALERT_AUDIO,
      (res) => {
        if (!res) return;
        const queue = getQueue(res.channel);
        queue.setQueueOptions({
          maxQueueLength: res.maxQueueLength,
          gapTime: 0.2,
        });
        queue.enqueue(res.data, true, {
          gain: res.volume / 100,
          key: res.id,
        });
      },
    );

    const removeAlertClear = window.api.on(
      APP_EVENTS_RESPONSE.ALERT_CLEAR,
      () => stopQueues("alerts"),
    );

    if (isInitialMount.current) {
      window.api.emit(APP_EVENTS.LOAD_APP);
      isInitialMount.current = false;
    }

    return () => {
      removeLoadApp();
      removeTTSData();
      removeAlertAudio();
      removeAlertClear();
    };
  }, []);

  return (
    <AppContext.Provider value={{ appLoading }}>
      {appLoading ? <SplashScreen /> : children}
    </AppContext.Provider>
  );
}
