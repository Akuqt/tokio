// NOTE: DO NOT CHANGE. browser sources and overlays point at this address.
export const SERVER_PORT = 37891;
export const APP_HOSTNAME = "tokio-app.local";

export const getOverlayURL = (id: string) =>
  `http://${APP_HOSTNAME}:${SERVER_PORT}/${encodeURIComponent(id)}/`;

// Overlays connect here with their id to get the events meant for them.
export const getOverlaySocketURL = (id: string) =>
  `ws://localhost:${SERVER_PORT}/?id=${encodeURIComponent(id)}`;
