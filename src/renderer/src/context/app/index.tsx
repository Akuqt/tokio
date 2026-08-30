import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { SplashScreen } from "@/splash";
import { useAudio } from "@renderer/hooks";
import React, { createContext, useEffect, useRef, useState } from "react";

export interface AppContextType {
  appLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isInitialMount = useRef(true);
  const [appLoading, setAppLoading] = useState(true);

  const { getQueue } = useAudio();

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

    if (isInitialMount.current) {
      window.api.emit(APP_EVENTS.LOAD_APP);
      isInitialMount.current = false;
    }

    return () => {
      removeLoadApp();
      removeTTSData();
    };
  }, []);

  return (
    <AppContext.Provider value={{ appLoading }}>
      {appLoading ? <SplashScreen /> : children}
    </AppContext.Provider>
  );
}
