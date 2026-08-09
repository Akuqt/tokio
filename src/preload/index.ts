import { Theme } from "@/common/schemas";
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
