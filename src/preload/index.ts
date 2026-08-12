import { APP_EVENTS, AppEventsMap } from "@/common/types";
import { electronAPI } from "@electron-toolkit/preload";
import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

type Callback = (event: IpcRendererEvent, ...args: any[]) => void;

const api = {
  on: <T extends APP_EVENTS>(
    event: T,
    callback: (data: AppEventsMap[T]) => void,
  ) => {
    const cb: Callback = (_, data: AppEventsMap[T]) => callback(data);
    ipcRenderer.on(event, cb);
    return () => {
      ipcRenderer.off(event, cb);
    };
  },
  emit: <T extends APP_EVENTS>(event: T, data: AppEventsMap[T]) =>
    ipcRenderer.send(event, data),
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
