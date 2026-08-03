import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer } from "electron";

const api = {
  startListener: (username: string) =>
    ipcRenderer.send("app:listener:start", username),
  onListener: (callback: () => void) =>
    ipcRenderer.on("app:listener:done", () => callback()),
  onAudioData: (callback: (base64String: string) => void) =>
    ipcRenderer.on("app:audio:data", (_event, base64String: string) => {
      callback(base64String);
    }),
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
