import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Same aliases as the main process in electron.vite.config.ts
    alias: {
      "@/common": resolve("src/common"),
      "@": resolve("src/main"),
    },
  },
  test: {
    environment: "node",
    include: ["src/main/**/*.test.ts", "src/common/**/*.test.ts"],
    setupFiles: ["test/setup.ts"],
    restoreMocks: true,
    unstubGlobals: true,
  },
});
