export default {
  CSP: {
    prod: "default-src 'self'; frame-src * local-resource: 'self'; media-src 'self' blob:; script-src 'self' http: https:; style-src 'self' 'unsafe-inline'; worker-src 'self' 'unsafe-inline' blob:; img-src 'self' data: http: https:;",
    dev: "default-src 'self'; frame-src * local-resource: 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline' http: https:; style-src 'self' 'unsafe-inline'; worker-src 'self' 'unsafe-inline' blob:; connect-src 'self' *; img-src 'self' data: http: https:;",
  },
  CMD: {
    HOST: ["C:\\Windows", "System32", "drivers", "etc", "hosts"],
    IP: "127.0.0.1",
    FQDN: "tokio-app.local",
    NAME: "Tokio",
  },
  DB: {
    name: "tokio",
  },
  APP: {
    folderName: ".tokio",
  },
  URL_FILTER: {
    urls: [
      "ws://localhost:37891/*",
      "ws://127.0.0.1:37891/*",
      "wss://localhost:37891/*",
      "wss://127.0.0.1:37891/*",
    ],
  },
};
