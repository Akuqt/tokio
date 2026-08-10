import { Profile, Theme } from "@/common/schemas";
import { ServiceAppProvider, VoiceData } from "@/common/types";
import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

const api = {
  startListener: (username: string) =>
    ipcRenderer.send("app:listener:start", username),
  onListener: (callback: () => void) =>
    ipcRenderer.on("app:listener:done", () => callback()),
  onAudioData: (callback: (data: Uint8Array<ArrayBufferLike> | null) => void) =>
    ipcRenderer.on(
      "app:audio:data",
      (_event, data: Uint8Array<ArrayBufferLike> | null) => {
        callback(data);
      },
    ),
  minimize: () => ipcRenderer.send("window-minimize"),
  maximize: () => ipcRenderer.send("window-maximize"),
  close: () => ipcRenderer.send("window-close"),
  onResize: (callback: (state: "normal" | "maximized") => void) =>
    ipcRenderer.on("window-resize", (_, state: "normal" | "maximized") =>
      callback(state),
    ),
  getTheme: () => ipcRenderer.send("app:get:theme"),
  onGetTheme: (
    callback: (res: {
      success: boolean;
      theme: Theme;
      mode: "dark" | "light";
    }) => void,
  ) =>
    ipcRenderer.on(
      "app:res:theme",
      (
        _,
        res: {
          success: boolean;
          theme: Theme;
          mode: "dark" | "light";
        },
      ) => callback(res),
    ),
  getProfile: () => ipcRenderer.send("app:get:profile"),
  setProfile: (file: string) => ipcRenderer.send("app:set:profile", { file }),
  onGetProfile: (
    callback: (res: {
      success: boolean;
      profile: Profile;
      profiles: { name: string; active: boolean; file: string }[];
    }) => void,
  ) =>
    ipcRenderer.on(
      "app:res:profile",
      (
        _,
        res: {
          success: boolean;
          profile: Profile;
          profiles: { name: string; active: boolean; file: string }[];
        },
      ) => callback(res),
    ),
  getServices: () => ipcRenderer.send("app:get:services"),
  getVoices: () => ipcRenderer.send("app:get:voices"),
  setServices: (name: string, type: "tts" | "connector", key?: string) =>
    ipcRenderer.send("app:set:services", { name, type, key }),
  onGetServices: (
    callback: (res: {
      success: boolean;
      services: ServiceAppProvider[];
    }) => void,
  ) =>
    ipcRenderer.on(
      "app:res:services",
      (
        _,
        res: {
          success: boolean;
          services: ServiceAppProvider[];
        },
      ) => callback(res),
    ),
  onGetVoices: (
    callback: (res: { success: boolean; voices: VoiceData[] }) => void,
  ) =>
    ipcRenderer.on(
      "app:res:voices",
      (_, res: { success: boolean; voices: VoiceData[] }) => callback(res),
    ),
  updateTTSProfile: (settings: Profile["tts"]) =>
    ipcRenderer.send("app:update:tts:profile", { settings }),
  onUpdateTTSProfile: (callback: (res: { success: boolean }) => void) =>
    ipcRenderer.on(
      "app:update:res:tts:profile",
      (_, res: { success: boolean }) => callback(res),
    ),
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore
  window.electron = electronAPI;
  // @ts-ignore
  window.api = api;
}
