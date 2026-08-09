/// <reference types="vite/client" />

export {};

declare global {
  interface Window {
    api: {
      startListener: (username: string) => void;
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      onResize: (callback: (state: "normal" | "maximized") => void) => void;
      onListener: (callback: () => void) => void;
      onAudioData: (
        callback: (data: Uint8Array<ArrayBufferLike> | null) => void,
      ) => void;
      getTheme: () => void;
      onGetTheme: (
        callback: (res: {
          success: boolean;
          theme: Theme;
          mode: "dark" | "light";
        }) => void,
      ) => void;
    };
  }
}
