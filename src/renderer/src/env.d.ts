/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    api: {
      startListener: (username: string) => void;
      onListener: (callback: () => void) => void;
      onAudioData: (
        callback: (data: Uint8Array<ArrayBufferLike> | null) => void,
      ) => void;
    };
  }
}
