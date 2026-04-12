import "./App.css";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import LegislativeRecord from "./pages/LegislativeRecord";
import JudicialRecord from "./pages/JudicialRecord";
import CandidateProfile from "./pages/CandidateProfile";
import UnresolvedQueue from "./pages/admin/UnresolvedQueue";
import Prototype from "./pages/Prototype";
import { CompassProvider } from "./contexts/CompassContext";
import { getToken, clearToken, redirectToLogin, extractHashToken } from "./lib/auth";

// Extract JWT from hash fragment on every page load (Auth Hub callback handler)
extractHashToken();

// One-time cleanup of legacy localStorage keys from pre-refactor code (Oct 2025)
localStorage.removeItem('lastZip');

function RequireAuth({ children }) {
  if (!getToken()) {
    redirectToLogin();
    return null;
  }
  return children;
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
    <CompassProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/politician/:id" element={<Profile />} />
        <Route path="/politician/:id/record" element={<LegislativeRecord />} />
        <Route path="/politician/:id/judicial-record" element={<JudicialRecord />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/admin/unresolved" element={<RequireAuth><UnresolvedQueue /></RequireAuth>} />
        <Route path="/prototype" element={<Prototype />} />
      </Routes>
    </CompassProvider>
  );
}

export default App;
