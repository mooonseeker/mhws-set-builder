/**
 * @fileoverview Vite configuration file for MHWS Set Builder.
 * @see https://vitejs.dev/config/
 */

import { readFileSync } from "fs";
import path from "path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(
      (
        JSON.parse(readFileSync("./package.json", "utf-8")) as {
          version: string;
        }
      ).version,
    ),
  },
});
