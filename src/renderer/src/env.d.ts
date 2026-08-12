/// <reference types="vite/client" />

export {};

import { APP_EVENTS, AppEventsMap } from "@/common/types";

declare global {
  interface Window {
    api: {
      on: <T extends APP_EVENTS>(
        event: T,
        callback: (data?: AppEventsMap[T]) => void,
      ) => () => void;
      emit: <T extends APP_EVENTS>(event: T, data?: AppEventsMap[T]) => void;
    };
  }
}
