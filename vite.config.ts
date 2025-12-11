import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(
      JSON.parse(readFileSync("./package.json", "utf-8")).version,
    ),
  },
});
