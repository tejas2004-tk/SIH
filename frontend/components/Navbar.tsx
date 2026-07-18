"use client";

import { Shield, Menu, X, Zap } from "lucide-react";
import { useState } from "react";

interface Props {
  view: "landing" | "app";
  onNavigate: (v: "landing" | "app") => void;
}

export default function Navbar({ view, onNavigate }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate("landing")} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">SentinelAI</span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {view === "landing" ? (
              <button onClick={() => onNavigate("app")} className="btn-primary text-sm">
                <Zap className="w-4 h-4 mr-1.5" /> Open Dashboard
              </button>
            ) : (
              <button onClick={() => onNavigate("landing")} className="btn-ghost text-sm">
                Back to Home
              </button>
            )}
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white p-4 animate-slide-down">
          {view === "landing" ? (
            <button onClick={() => { onNavigate("app"); setMobileOpen(false); }} className="btn-primary w-full text-sm">
              <Zap className="w-4 h-4 mr-1.5" /> Open Dashboard
            </button>
          ) : (
            <button onClick={() => { onNavigate("landing"); setMobileOpen(false); }} className="btn-ghost w-full text-sm">
              Back to Home
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
