import type { EventCallback, EventItem } from "../types";

export class EventStack<T, U> {
  private evs: EventItem<T, U, any>[];

  constructor() {
    this.evs = [];
  }

  public push<K>(name: string, callback: EventCallback<T, U, K>) {
    if (!name || !callback) return;
    this.evs.push({ event: name, callback });
  }

  public getEvents() {
    return this.evs;
  }

  public merge(events: EventStack<T, U>) {
    this.evs.push(...events.getEvents());
  }
}

export function formatError(error: unknown) {
  if (!(error instanceof Error)) return "unknown";
  const message = error.message || "<message?>";
  const cause =
    error.cause instanceof Error ? error.cause : new Error("<cause?>");
  return `message: ${message} -- cause: ${cause.message}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => {
      res();
    }, ms);
  });
}
