import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Use local ev-ui build when it exists alongside this repo (dev only).
// Netlify deploys ignore this because ../ev-ui won't exist in CI.
const localEvUi = path.resolve(__dirname, "../ev-ui/dist");
const useLocalEvUi = fs.existsSync(localEvUi);

// PostHog source-map upload. Inert unless POSTHOG_API_KEY and POSTHOG_PROJECT_ID
// are set at build time (CI / Render build env). See ERROR_TRACKING.md.
const posthogSourcemapsEnabled = Boolean(
  process.env.POSTHOG_API_KEY && process.env.POSTHOG_PROJECT_ID,
);

// https://vite.dev/config/
export default defineConfig(async () => {
  const plugins = [react()];
  if (posthogSourcemapsEnabled) {
    const { default: posthogSourcemaps } = await import("@posthog/rollup-plugin");
    plugins.push(
      posthogSourcemaps({
        personalApiKey: process.env.POSTHOG_API_KEY,
        projectId: process.env.POSTHOG_PROJECT_ID,
        host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
        sourcemaps: { enabled: true, releaseName: "essentials" },
      }),
    );
  }

  return {
    plugins,
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
    // 'hidden' emits maps for upload without a sourceMappingURL comment in the
    // shipped bundles; the plugin deletes them after upload by default.
    build: { sourcemap: posthogSourcemapsEnabled ? 'hidden' : false },
  };
});
