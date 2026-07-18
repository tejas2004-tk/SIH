"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";
import LandingPage from "../components/LandingPage";
import Dashboard from "../components/Dashboard";

export default function HomePage() {
  const [view, setView] = useState<"landing" | "app">("landing");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar view={view} onNavigate={setView} />
      {view === "landing" ? <LandingPage onGetStarted={() => setView("app")} /> : <Dashboard />}
    </div>
  );
}
