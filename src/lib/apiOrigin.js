/**
 * Origin of the EV API, for code that needs an absolute URL — the session
 * poll, and the `apiUrl` prop handed to ev-ui components, which otherwise
 * default to the old https://api.empowered.vote host.
 *
 * Builds use VITE_API_URL (set on Render). Local dev with it unset uses the dev
 * server's own origin, so the call goes through the /api proxy in
 * vite.config.js: the live API's CORS allow-list blocks localhost.
 */
export const API_ORIGIN = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : import.meta.env.DEV && typeof window !== 'undefined'
    ? window.location.origin
    : 'https://accounts-api.empowered.vote';
