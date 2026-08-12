import { Theme } from "../../schemas";

export const defaultTheme: Theme = {
  name: "Default",
  dark: {
    backgroundColor: {
      primary: "#1a1a1a", // Main content area
      secondary: "#242424", // Sidebar and Navbar
    },
    fontColor: {
      primary: "#f4f4f5", // Main text (white-ish)
      secondary: "#a1a1aa", // Muted text / unselected icons
    },
    logo: {
      primary: "#ff4757", // Red background
      secondary: "#ffffff", // White 'T' text
    },
    navBar: {
      controls: {
        minimize: {
          color: "#a1a1aa",
          hover: "#27272a", // Subtle grey hover
        },
        maximize: {
          color: "#a1a1aa",
          hover: "#27272a",
        },
        close: {
          color: "#a1a1aa",
          hover: "#e81123", // Red hover for close
        },
      },
      profile: {
        hover: "#18181b",
        selected: {
          tick: "#10b981", // Green checkmark
          background: "#27272a", // Lighter grey for active selection
        },
      },
    },
    sideBar: {
      items: {
        color: "#a1a1aa",
        hover: "#f4f4f5", // Lighten on hover
        selected: "#ff4757", // Accent red for active route
      },
    },
  },
  light: {
    backgroundColor: {
      primary: "#ffffff", // White main content area
      secondary: "#f4f4f5", // Light grey Sidebar and Navbar
    },
    fontColor: {
      primary: "#09090b", // Almost black text
      secondary: "#52525b", // Muted grey text
    },
    logo: {
      primary: "#ff4757", // Keep the red accent
      secondary: "#ffffff", // White 'T' text
    },
    navBar: {
      controls: {
        minimize: {
          color: "#52525b",
          hover: "#e4e4e7", // Light grey hover
        },
        maximize: {
          color: "#52525b",
          hover: "#e4e4e7",
        },
        close: {
          color: "#52525b",
          hover: "#e81123", // Keep standard red close hover
        },
      },
      profile: {
        hover: "#e4e4e7",
        selected: {
          tick: "#10b981", // Green checkmark
          background: "#d4d4d8", // Darker grey for active selection in light mode
        },
      },
    },
    sideBar: {
      items: {
        color: "#52525b",
        hover: "#09090b", // Darken on hover
        selected: "#ff4757", // Accent red for active route
      },
    },
  },
};
