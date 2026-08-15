import { APP_EVENTS } from "@/common/types";
import { Stack } from "@/helper/events";
import { EventCallback } from "@/types";
import { AppHandler } from "./app";

export default class Handler extends AppHandler {
  private addEvent(name: APP_EVENTS, cb: EventCallback<APP_EVENTS>) {
    this.ipcMain.on(name, (ev, params) => cb(this, ev, params));
  }

  public async init(events: Stack) {
    await this.initApp();

    for (const { event, callback } of events.getEvents()) {
      this.addEvent(event, callback);
    }
  }
}
