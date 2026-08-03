import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@/common": resolve("src/common"),
        "@": resolve("src/main"),
      },
    },
  },
  preload: {},
  renderer: {
    resolve: {
      alias: {
        "@renderer": resolve("src/renderer/src"),
        "@/common": resolve("src/common"),
        "@": resolve("src/renderer/src"),
      },
    },
    plugins: [react()],
  },
});
