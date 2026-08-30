import react from "@vitejs/plugin-react";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  base: "./",
  resolve: {
    alias: {
      "@/common": resolve(__dirname, "../common"),
    },
  },
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "../../music-out"),
    emptyOutDir: true,
  },
  server: {
    port: 8989,
  },
});
