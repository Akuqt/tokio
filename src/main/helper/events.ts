import { APP_EVENTS } from "@/common/types";
import { EventCallback, EventItem } from "@/types";

export type Stack = EventStack<APP_EVENTS>;

class EventStack<K extends APP_EVENTS> {
  private evs: EventItem<K>[];

  constructor() {
    this.evs = [];
  }

  public push<E extends APP_EVENTS>(event: E, callback: EventCallback<E>) {
    if (!event || !callback) return;
    this.evs.push({ event, callback } as unknown as {
      [P in K]: EventItem<P>;
    }[K]);
  }

  public getEvents() {
    return this.evs;
  }

  public merge(events: EventStack<K>) {
    this.evs.push(...events.getEvents());
  }
}

export function createStack(): Stack {
  return new EventStack();
}

export function mergeStacks(...stacks: Stack[]): Stack {
  const events = createStack();
  for (const ev of stacks) {
    events.merge(ev);
  }
  return events;
}
