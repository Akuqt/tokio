// NOTE: DO NOT CHANGE. browser sources and overlays point at this address.
export const SERVER_PORT = 37891;
export const APP_HOSTNAME = "tokio-app.local";

export const getOverlayURL = (id: string) =>
  `http://${APP_HOSTNAME}:${SERVER_PORT}/${encodeURIComponent(id)}/`;
