import { APP_EVENTS, TokioPayload, TokioPreviewMessage } from "@/common/types";

/**
 * Sends a payload to an overlay's preview iframes (the card and its full size
 * view), and to its live instances through main.
 */
export function postToOverlay(id: string, payload: TokioPayload) {
  const targets = document.querySelectorAll<HTMLIFrameElement>(
    `iframe[name="${CSS.escape(`TOKIO_APP-${id}`)}"]`,
  );

  if (targets.length === 0) {
    console.warn(`Iframe ${id} not found or not loaded yet.`);
    return;
  }

  const message: TokioPreviewMessage = { action: "TOKIO_PREVIEW", payload };
  for (const target of targets) target.contentWindow?.postMessage(message, "*");
  window.api.emit(APP_EVENTS.SEND_OVERLAY_DATA, { id, payload });
}
