import { EventCallback } from "@/common/types";
import { EventStack, formatError } from "@/common/util";
import Logger from "@/logger";
import { AppHandlerVariables } from "@/types";
import { IpcMainEvent } from "electron";
import { AppHandler } from "./app";

export default class Handler extends AppHandler {
  private addEvent(
    name: string,
    cb: EventCallback<AppHandlerVariables, IpcMainEvent, any>,
  ) {
    this.ipcMain.on(name, (ev, params) => cb(this, ev, params));
  }

  public async init(events: EventStack<AppHandlerVariables, IpcMainEvent>) {
    try {
      await this.initApp();
      for (const { event, callback } of events.getEvents())
        this.addEvent(event, callback);
    } catch (error) {
      Logger.error(
        `<System> Unable to initialize app -- ${formatError(error)}`,
        {
          file: this._log2file,
          path: this.files.logs.system,
        },
      );
    }
  }
}
