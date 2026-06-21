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
      ? { "@empoweredvote/ev-ui": localEvUi }
      : {},
    dedupe: ["react", "react-dom", "@react-spring/web", "@floating-ui/react"],
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://accounts-api.empowered.vote',
        changeOrigin: true,
        secure: true,
        // The prod backend's CORS allow-list doesn't include localhost, and it
        // THROWS (→ 500) on a disallowed Origin rather than just omitting CORS
        // headers. Same-origin GETs carry no Origin so they pass, but POSTs do —
        // which is why browse/by-area etc. 500 only in local dev. Strip the
        // Origin header so the backend treats proxied calls as same-origin
        // (its `if (!origin) allow` branch). Dev-only; does not affect prod.
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
          });
        },
      },
    },
  },
});
