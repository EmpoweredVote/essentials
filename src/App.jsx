import "./App.css";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { loadUserAddressFromContext } from "./lib/compass";
import { usePostHog } from "posthog-js/react";
import Landing from "./pages/Landing";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import LegislativeRecord from "./pages/LegislativeRecord";
import JudicialRecord from "./pages/JudicialRecord";
import Citations from "./pages/Citations";
import CandidateProfile from "./pages/CandidateProfile";
import UnresolvedQueue from "./pages/admin/UnresolvedQueue";
import StagingQueue from "./pages/admin/StagingQueue";
import DiscoveryDashboard from "./pages/admin/DiscoveryDashboard";
import { CompassProvider } from "./contexts/CompassContext";
import { getToken, clearToken, redirectToLogin, extractHashToken } from "./lib/auth";

// Extract JWT from hash fragment on every page load (Auth Hub callback handler)
extractHashToken();

// One-time cleanup of legacy localStorage keys from pre-refactor code (Oct 2025)
localStorage.removeItem('lastZip');

function PostHogPageview() {
  const location = useLocation();
  const posthog = usePostHog();
  useEffect(() => {
    posthog?.capture('$pageview');
    return () => posthog?.capture('$pageleave');
  }, [location.pathname]);
  return null;
}

function RequireAuth({ children }) {
  if (!getToken()) {
    redirectToLogin();
    return null;
  }
  return children;
}

function ElectionsRedirect() {
  const [to, setTo] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadUserAddressFromContext().then((stored) => {
      if (cancelled) return;
      if (stored?.addr) {
        setTo(`/results?prefilled=true&view=elections&q=${encodeURIComponent(stored.addr)}`);
      } else {
        setTo('/results?prefilled=true&view=elections');
      }
    });
    return () => { cancelled = true; };
  }, []);
  if (to === null) return null;
  return <Navigate to={to} replace />;
}

function App() {
  // Cross-app logout sync — detect ev_session cookie cleared by another app
  useEffect(() => {
    const SESSION_URL = `${import.meta.env.VITE_API_URL || 'https://api.empowered.vote'}/api/auth/session`;
    const poll = async () => {
      if (!getToken()) return; // skip if not logged in
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await fetch(SESSION_URL, { credentials: 'include' });
        if (res.status === 401) clearToken();
      } catch {
        // Network error — don't log out
      }
    };
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <CompassProvider compassEnabled={localStorage.getItem('ev:compassMode') === 'true'}>
      <PostHogPageview />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/politician/:id" element={<Profile />} />
        <Route path="/politician/:id/record" element={<LegislativeRecord />} />
        <Route path="/politician/:id/judicial-record" element={<JudicialRecord />} />
        <Route path="/politician/:id/citations" element={<Citations />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/admin/unresolved" element={<RequireAuth><UnresolvedQueue /></RequireAuth>} />
        <Route path="/admin/staging" element={<RequireAuth><StagingQueue /></RequireAuth>} />
        <Route path="/admin/discovery" element={<RequireAuth><DiscoveryDashboard /></RequireAuth>} />
        <Route path="/elections" element={<ElectionsRedirect />} />
      </Routes>
    </CompassProvider>
  );
}

export default App;
