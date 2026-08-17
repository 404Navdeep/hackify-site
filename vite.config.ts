import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    cssTarget: "chrome90",
    assetsInlineLimit: 8192,
  },
});
