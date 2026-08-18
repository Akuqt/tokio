import { Theme } from "../../schemas";

export const defaultTheme: Theme = {
  name: "Default",
  dark: {
    backgroundColor: {
      primary: {
        color: "#121212",
        hover: "#27272a", // Lighter step for clear background hover
      },
      secondary: {
        color: "#1e1e1e",
        hover: "#3f3f46", // Lighter step for clear secondary hover
      },
    },
    accentColor: {
      primary: {
        color: "#f43f5e", // Smooth Rose
        hover: "#fb7185", // Brighter Rose to "pop" in dark mode
      },
      secondary: {
        color: "#14b8a6", // Calm Teal
        hover: "#2dd4bf", // Brighter Teal to "pop" in dark mode
      },
    },
    fontColor: {
      primary: "#f1f5f9",
      secondary: "#a1a1aa",
    },
  },
  light: {
    backgroundColor: {
      primary: {
        color: "#ffffff",
        hover: "#e4e4e7", // Darker gray for obvious interaction
      },
      secondary: {
        color: "#f4f4f5",
        hover: "#d4d4d8", // Darker gray for obvious interaction
      },
    },
    accentColor: {
      primary: {
        color: "#e11d48", // Deeper Rose
        hover: "#9f1239", // Much darker Rose for a solid click/hover feel
      },
      secondary: {
        color: "#0f766e", // Deeper Teal
        hover: "#134e4a", // Much darker Teal for a solid click/hover feel
      },
    },
    fontColor: {
      primary: "#09090b",
      secondary: "#71717a",
    },
  },
};
