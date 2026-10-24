import https from 'node:https';
import { defineConfig } from 'vite';
import baseConfig from '../vite.config.js';
import { PREVIEW_PORT, QA_USER_AGENT } from './constants.js';

// Serves the built app for the browser journeys with /api proxied to the live
// API. Same-origin on purpose: the live API's CORS allow-list has only the
// production origins, so a build that called it directly from localhost would
// be blocked by the browser. Build with VITE_API_URL=http://localhost:4173
// (npm run e2e:serve does) so every call goes through this proxy.
export default defineConfig(async (env) => {
  const base = typeof baseConfig === 'function' ? await baseConfig(env) : baseConfig;
  return {
    ...base,
    // Its own folder, so a local e2e run does not replace dist/ with a build
    // that only works behind this proxy.
    build: { ...base.build, outDir: 'dist-e2e' },
    preview: {
      port: PREVIEW_PORT,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'https://accounts-api.empowered.vote',
          changeOrigin: true,
          secure: true,
          // Reuse connections. Without this every proxied call opens a fresh TLS
          // connection, and a profile (a dozen calls) took 2-5 s locally when the
          // API itself answers each in ~0.3 s.
          agent: new https.Agent({ keepAlive: true }),
          headers: { 'user-agent': QA_USER_AGENT },
          // Same reason as the dev proxy in vite.config.js: the live API throws
          // (500) on a POST whose Origin is not on its allow-list.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
            });
          },
        },
      },
    },
  };
});
