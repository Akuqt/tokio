/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    api: {
      startListener: (username: string) => void;
      onListener: (callback: () => void) => void;
      onAudioData: (callback: (base64String: string) => void) => void;
    };
  }
}
