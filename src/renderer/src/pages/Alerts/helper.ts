import { Alert } from "@/common/schemas";
import { TOKIO_EVENTS } from "@/common/types";

export function createAlert(): Alert {
  return {
    id: crypto.randomUUID(),
    enabled: true,
    trigger: { type: TOKIO_EVENTS.FOLLOW, gifts: [] },
    sound: null,
    volume: 100,
  };
}
