import { useState } from "react";
import "./App.css";
import { Routes, Router, Route } from "react-router";
import Home from "./pages/home";
import Dashboard from "./pages/Dashboard";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/test" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
