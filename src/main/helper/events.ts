import { EventStack } from "@/common/util";
import { type IpcMainEvent } from "electron";

export function createStack<T, U = IpcMainEvent>(): EventStack<T, U> {
  return new EventStack();
}

export function mergeStacks<T, U = IpcMainEvent>(
  ...stacks: EventStack<T, U>[]
): EventStack<T, U> {
  const events = new EventStack<T, U>();
  for (const ev of stacks) {
    events.merge(ev);
  }
  return events;
}
