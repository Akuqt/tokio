import { APP_HOSTNAME, SERVER_PORT } from "@/common/util";

export default {
  CSP: {
    prod: "default-src 'self'; frame-src * local-resource: 'self'; media-src 'self' blob:; script-src 'self' http: https:; style-src 'self' 'unsafe-inline'; worker-src 'self' 'unsafe-inline' blob:; img-src 'self' data: http: https:;",
    dev: "default-src 'self'; frame-src * local-resource: 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline' http: https:; style-src 'self' 'unsafe-inline'; worker-src 'self' 'unsafe-inline' blob:; connect-src 'self' *; img-src 'self' data: http: https:;",
  },
  CMD: {
    HOST:
      process.platform === "win32"
        ? [
            process.env.SystemRoot ?? "C:\\Windows",
            "System32",
            "drivers",
            "etc",
            "hosts",
          ]
        : ["/etc", "hosts"],
    IP: "127.0.0.1",
    IP6: "::1",
    FQDN: APP_HOSTNAME,
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
      `ws://localhost:${SERVER_PORT}/*`,
      `ws://127.0.0.1:${SERVER_PORT}/*`,
      `wss://localhost:${SERVER_PORT}/*`,
      `wss://127.0.0.1:${SERVER_PORT}/*`,
      `ws://[::1]:${SERVER_PORT}/*`,
      `wss://[::1]:${SERVER_PORT}/*`,
    ],
  },
};
