import { APP_EVENTS, TokioPayload, TokioPreviewMessage } from "@/common/types";

/**
 * Sends a payload to an overlay's preview iframe, and to its live instances
 * through main.
 */
export function postToOverlay(id: string, payload: TokioPayload) {
  const target = window.frames[`TOKIO_APP-${id}`];

  if (!target) {
    console.warn(`Iframe ${id} not found or not loaded yet.`);
    return;
  }

  const message: TokioPreviewMessage = { action: "TOKIO_PREVIEW", payload };
  target.postMessage(message, "*");
  window.api.emit(APP_EVENTS.SEND_OVERLAY_DATA, { id, payload });
}
