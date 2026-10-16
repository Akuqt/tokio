import { APP_EVENTS, AppEventsMap } from "@/common/types";
import { useEffect, useRef } from "react";

/**
 * Sends a request to the main process once, when the component mounts.
 * StrictMode re-runs effects, so a ref keeps it from being sent twice.
 */
export function useIpcRequest<T extends APP_EVENTS>(
  event: T,
  data?: AppEventsMap[T],
) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    window.api.emit(event, data);
  }, []);
}
