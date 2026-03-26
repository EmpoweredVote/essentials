import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Use local ev-ui build when it exists alongside this repo (dev only).
// Netlify deploys ignore this because ../ev-ui won't exist in CI.
const localEvUi = path.resolve(__dirname, "../ev-ui/dist");
const useLocalEvUi = fs.existsSync(localEvUi);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: useLocalEvUi
      ? { "@chrisandrewsedu/ev-ui": localEvUi }
      : {},
    dedupe: ["react", "react-dom", "@react-spring/web"],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://accounts-api.empowered.vote',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
