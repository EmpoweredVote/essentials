import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import LegislativeRecord from "./pages/LegislativeRecord";
import { CompassProvider } from "./contexts/CompassContext";
import AuthIndicator from "./components/AuthIndicator";

function App() {
  return (
    <CompassProvider>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 1000 }}>
        <AuthIndicator />
      </div>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/results" element={<Results />} />
        <Route path="/politician/:id" element={<Profile />} />
        <Route path="/politician/:id/record" element={<LegislativeRecord />} />
      </Routes>
    </CompassProvider>
  );
}

export default App;
