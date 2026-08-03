export * from "./connector";

export type EventCallback<T, U, K> = (
  handler: T,
  event: U,
  ...args: K[]
) => void;

export interface EventItem<T, U, K> {
  event: string;
  callback: EventCallback<T, U, K>;
}

export type LoggerOptions = { file: boolean; path: string };

export interface Folders {
  readonly appFolder: string;
  readonly binFolder: string;
  readonly settingsPath: string;
}
