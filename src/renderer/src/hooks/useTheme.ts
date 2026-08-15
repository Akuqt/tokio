import { AppContext } from "@renderer/context";
import { useContext } from "react";

export function useTheme() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return {
    toggleThemeMode: context.toggleThemeMode,
    theme: context.theme,
    theme_mode: context.theme_mode,
  };
}
