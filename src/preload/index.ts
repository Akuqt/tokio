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
