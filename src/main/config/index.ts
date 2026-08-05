export default {
  CSP: {
    prod: "default-src 'self'; media-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline';",
    dev: "default-src 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:5173 http://localhost:5173;",
  },
  CMD: {
    HOST: ["C:\\Windows", "System32", "drivers", "etc", "hosts"],
    IP: "127.0.0.1",
    FQDN: "tokio-app.local",
    NAME: "Tokio",
  },
  DB: {
    name: "tokio-app.sqlite",
    DEFAULT_APP_CONFIG: {
      log2file: true,
      enable_server: false,
      server_port: 6767,
      use_session_id: false,
      session_id: "",
      theme_mode: "system",
      theme_name: "default",
      profile: "default",
    },
  },
};
