export default {
  CSP: {
    prod: "default-src 'self'; media-src 'self' blob:; script-src 'self'; style-src 'self' 'unsafe-inline';",
    dev: "default-src 'self'; media-src 'self' blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws://localhost:5173 http://localhost:5173;",
  },
};
