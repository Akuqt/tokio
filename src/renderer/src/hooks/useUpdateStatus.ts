import { APP_EVENTS, APP_EVENTS_RESPONSE, UpdateStatus } from "@/common/types";
import { useState } from "react";
import { useIpcListener } from "./useIpcListener";
import { useIpcRequest } from "./useIpcRequest";

/** The updater's status, kept current while the component is mounted. */
export function useUpdateStatus(): UpdateStatus {
  const [status, setStatus] = useState<UpdateStatus>({ state: "idle" });

  useIpcRequest(APP_EVENTS.GET_UPDATE_STATUS);

  useIpcListener(APP_EVENTS_RESPONSE.UPDATE_STATUS, (res) => {
    if (res) setStatus(res);
  });

  return status;
}
