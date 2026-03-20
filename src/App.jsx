import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import LegislativeRecord from "./pages/LegislativeRecord";
import JudicialRecord from "./pages/JudicialRecord";
import CandidateProfile from "./pages/CandidateProfile";
import UnresolvedQueue from "./pages/admin/UnresolvedQueue";
import { CompassProvider } from "./contexts/CompassContext";

function App() {
  return (
    <CompassProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/politician/:id" element={<Profile />} />
        <Route path="/politician/:id/record" element={<LegislativeRecord />} />
        <Route path="/politician/:id/judicial-record" element={<JudicialRecord />} />
        <Route path="/candidate/:id" element={<CandidateProfile />} />
        <Route path="/admin/unresolved" element={<UnresolvedQueue />} />
      </Routes>
    </CompassProvider>
  );
}

export default App;
