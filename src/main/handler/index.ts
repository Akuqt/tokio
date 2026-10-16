import { APP_EVENTS, AppEventsMap } from "@/common/types";
import { runEvent, Stack } from "@/helper/events";
import { EventItem } from "@/types";
import { AppHandler } from "./app";

export default class Handler extends AppHandler {
  private addEvent(item: EventItem<APP_EVENTS>) {
    this.ipcMain.on(item.event, (ev, params: AppEventsMap[APP_EVENTS]) => {
      void runEvent(item, this, ev, params);
    });
  }

  public async init(events: Stack) {
    await this.initApp();

    for (const item of events.getEvents()) {
      this.addEvent(item);
    }
  }
}
