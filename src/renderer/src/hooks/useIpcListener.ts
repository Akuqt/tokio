import { APP_EVENTS_RESPONSE, AppEventsResponseMap } from "@/common/types";
import { useEffect, useEffectEvent } from "react";

/**
 * Subscribes to a main process response for as long as the component is
 * mounted. The callback always sees the latest props and state.
 */
export function useIpcListener<T extends APP_EVENTS_RESPONSE>(
  event: T,
  callback: (data?: AppEventsResponseMap[T]) => void,
) {
  const onEvent = useEffectEvent(callback);

  useEffect(() => window.api.on(event, (data) => onEvent(data)), [event]);
}
