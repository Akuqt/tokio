/// <reference types="vite/client" />

export {};

type InstallerEvent =
  "STATE" | "UI_READY" | "DRAG" | "INSTALL" | "LAUNCH" | "CLOSE" | "NON_FOUND";

declare global {
  interface Window {
    installer: {
      sendMessage(message: InstallerEvent): void;
      receiveMessage(callback: (message: string) => void): void;
    };
  }
}
