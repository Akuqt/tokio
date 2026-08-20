/// <reference types="vite/client" />

export {};

type InstallerEvent = "UI_READY" | "DRAG" | "INSTALL" | "LAUNCH" | "CLOSE";

declare global {
  interface Window {
    installer: {
      sendMessage(message: InstallerEvent): void;
      receiveMessage(callback: (message: string) => void): void;
    };
  }
}
