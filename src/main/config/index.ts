export default {
  CSP: {
    prod: "default-src 'self'; media-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; worker-src 'self' 'unsafe-inline' blob:;",
    dev: "default-src 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; worker-src 'self' 'unsafe-inline' blob:; connect-src 'self' ws://localhost:5173 http://localhost:5173;",
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
};
