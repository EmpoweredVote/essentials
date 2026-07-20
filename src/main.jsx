import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { PostHogProvider } from "posthog-js/react";
import { init, getClient } from "@empoweredvote/analytics";
import { AppErrorBoundary } from "@empoweredvote/analytics/react";
import "./index.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import App from "./App.jsx";

// Shared analytics: app + environment auto-stamped, key env-gated (unset locally
// = no-op), cross-subdomain identity, exception capture + noise filter. See the
// @empoweredvote/analytics package. NOTE: the deployed env MUST set
// VITE_POSTHOG_KEY, otherwise analytics runs in no-op mode (nothing sends).
init({
  app: "essentials",
  key: import.meta.env.VITE_POSTHOG_KEY,
  captureDeadClicks: true,
});

createRoot(document.getElementById("root")).render(
  <PostHogProvider client={getClient()}>
    <AppErrorBoundary>
      <BrowserRouter basename={import.meta.env.VITE_BASENAME || "/"}>
        <StrictMode>
          <App />
        </StrictMode>
      </BrowserRouter>
    </AppErrorBoundary>
  </PostHogProvider>
);
