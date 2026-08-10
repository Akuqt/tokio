/// <reference types="vite/client" />

export {};

import { Profile, Theme } from "@/common/schemas";
import { ServiceAppProvider, VoiceData } from "@/common/types";

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
      getProfile: () => void;
      getServices: () => void;
      getVoices: () => void;
      setProfile: (file: string) => void;
      setServices: (
        name: string,
        type: "tts" | "connector",
        key?: string,
      ) => void;
      onGetTheme: (
        callback: (res: {
          success: boolean;
          theme: Theme;
          mode: "dark" | "light";
        }) => void,
      ) => void;
      onGetProfile: (
        callback: (res: {
          success: boolean;
          profile: Profile;
          profiles: { name: string; active: boolean; file: string }[];
        }) => void,
      ) => void;
      onGetServices: (
        callback: (res: {
          success: boolean;
          services: ServiceAppProvider[];
        }) => void,
      ) => void;
      onGetVoices: (
        callback: (res: { success: boolean; voices: VoiceData[] }) => void,
      ) => void;
      updateTTSProfile: (settings: Profile["tts"]) => void;
      onUpdateTTSProfile: (
        callback: (res: { success: boolean }) => void,
      ) => void;
    };
  }
}
