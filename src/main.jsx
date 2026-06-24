import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import App from "./App.jsx";

posthog.init('phc_kpUWTjEcRRwSn7zdNstbDVYqAMQvEFZ5EgrWFeaAh5mu', {
  api_host: 'https://us.i.posthog.com',
  defaults: '2026-01-30',
  person_profiles: 'identified_only',
  capture_pageview: false,
  capture_dead_clicks: true,
});

createRoot(document.getElementById("root")).render(
  <PostHogProvider client={posthog}>
    <BrowserRouter basename={import.meta.env.VITE_BASENAME || "/"}>
      <StrictMode>
        <App />
      </StrictMode>
    </BrowserRouter>
  </PostHogProvider>
);
