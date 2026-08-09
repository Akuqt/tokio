import { Theme } from "@/common/schemas";
import { defaultTheme } from "@/common/util";
import React, { createContext, useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

export interface ThemeContextType {
  theme: Theme | null;
  mode: ThemeMode;
  toggleMode: () => void;
  themeLoading: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [themeLoading, setThemeLoading] = useState(true);

  useEffect(() => {
    if (!window.api) {
      setTheme(defaultTheme);
      applyThemeVariables(defaultTheme.dark);
      setThemeLoading(false);
      return;
    }

    window.api.onGetTheme((response) => {
      let themeToApply = defaultTheme;
      let modeToApply: ThemeMode = "dark";
      if (response.success && response.theme) {
        themeToApply = response.theme;
        modeToApply = response.mode;
      } else {
        console.warn("Failed to load theme from main, using default fallback.");
      }
      setTheme(themeToApply);
      setMode(modeToApply);
      applyThemeVariables(themeToApply[modeToApply]);
      setThemeLoading(false);
    });

    window.api.getTheme();
  }, []);

  const toggleMode = () => {
    if (!theme) return;

    const newMode = mode === "dark" ? "light" : "dark";

    applyThemeVariables(theme[newMode]);
    setMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode, themeLoading }}>
      {themeLoading ? (
        <div style={{ background: "#000", height: "100vh" }} /> // TODO: Handle Load later
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
}
