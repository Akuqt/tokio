import { Theme } from "@/common/schemas";
import { APP_EVENTS, APP_EVENTS_RESPONSE } from "@/common/types";
import { defaultTheme } from "@/common/util";
import { SplashScreen } from "@/splash";
import { useAudio } from "@renderer/hooks";
import React, { createContext, useEffect, useRef, useState } from "react";

type ThemeMode = "light" | "dark";

export interface AppContextType {
  theme: Theme | null;
  theme_mode: ThemeMode;
  toggleThemeMode: () => void;
  appLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const applyThemeVariables = (themeBranch: any, prefix = "-") => {
  Object.entries(themeBranch).forEach(([key, value]) => {
    const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const varName = `${prefix}-${kebabKey}`;

    if (typeof value === "object" && value !== null) {
      applyThemeVariables(value, varName);
    } else if (typeof value === "string") {
      document.documentElement.style.setProperty(varName, value);
    }
  });
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const isInitialMount = useRef(true);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [theme_mode, setThemeMode] = useState<ThemeMode>("dark");
  const [appLoading, setAppLoading] = useState(true);

  const { getQueue } = useAudio();

  const ttsQueue = getQueue("tts_data");

  useEffect(() => {
    if (!window.api) {
      setTheme(defaultTheme);
      applyThemeVariables(defaultTheme.dark);
      setAppLoading(false);
      return;
    }

    const removeLoadApp = window.api.on(
      APP_EVENTS_RESPONSE.LOAD_APP,
      (response) => {
        let themeToApply = defaultTheme;
        let modeToApply: ThemeMode = "dark";
        if (response?.success && response.data!.theme) {
          themeToApply = response.data!.theme.data;
          modeToApply = response.data!.theme.mode;
        } else {
          console.warn(
            "Failed to load theme from main, using default fallback.",
          );
        }
        setTheme(themeToApply);
        setThemeMode(modeToApply);
        applyThemeVariables(themeToApply[modeToApply]);
        setAppLoading(false);
      },
    );

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

  const toggleThemeMode = () => {
    if (!theme) return;

    const newMode = theme_mode === "dark" ? "light" : "dark";
    window.api.emit(APP_EVENTS.SET_THEME_MODE, { mode: newMode });
    applyThemeVariables(theme[newMode]);
    setThemeMode(newMode);
  };

  return (
    <AppContext.Provider
      value={{ theme, theme_mode, toggleThemeMode, appLoading }}
    >
      {appLoading ? <SplashScreen /> : children}
    </AppContext.Provider>
  );
}
