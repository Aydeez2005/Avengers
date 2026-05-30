"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import SwipeCard, { CardData } from "@/components/SwipeCard";

const MOCK_CARDS: CardData[] = [
  {
    id: 1,
    type: "Startup",
    name: "Clausify",
    tagline: "AI that reads contracts so lawyers don't have to",
    location: "Berlin",
    tags: ["AI / ML", "LegalTech", "B2B SaaS"],
    lookingFor: "Technical Co-founder — ML Engineer",
    meta: [
      { label: "Stage", value: "Pre-seed" },
      { label: "Team", value: "2 founders" },
      { label: "Founded", value: "2025" },
    ],
  },
  {
    id: 2,
    type: "Co-founder",
    name: "Jonas Weber",
    tagline: "Ex-McKinsey, building in climate tech. Looking for a technical co-founder.",
    location: "Berlin",
    tags: ["Climate", "Deep Tech", "B2B"],
    lookingFor: "CTO / Full-stack Engineer",
    meta: [
      { label: "Background", value: "Strategy" },
      { label: "Stage", value: "Idea" },
      { label: "Equity", value: "50/50" },
    ],
  },
  {
    id: 3,
    type: "Student",
    name: "Lena Müller",
    tagline: "MSc CS @ TU Berlin. Passionate about fintech and distributed systems.",
    location: "Berlin",
    tags: ["Fintech", "Distributed Systems", "Python"],
    lookingFor: "Startup project or co-founder to build with",
    meta: [
      { label: "University", value: "TU Berlin" },
      { label: "Year", value: "3rd" },
      { label: "Available", value: "20h/week" },
    ],
  },
  {
    id: 4,
    type: "Researcher",
    name: "Dr. Ahmed Hassan",
    tagline: "Quantum computing researcher at HU Berlin looking to commercialise findings.",
    location: "Berlin",
    tags: ["Quantum", "Deep Tech", "Hardware"],
    lookingFor: "Startup partner to spin out research",
    meta: [
      { label: "Institution", value: "HU Berlin" },
      { label: "Field", value: "Quantum" },
      { label: "Patents", value: "3" },
    ],
  },
  {
    id: 5,
    type: "Startup",
    name: "Rootly",
    tagline: "Making urban farming accessible for apartment dwellers across Europe",
    location: "Berlin",
    tags: ["AgriTech", "Consumer", "Hardware"],
    lookingFor: "Head of Growth / CMO",
    meta: [
      { label: "Stage", value: "Seed" },
      { label: "Team", value: "4 people" },
      { label: "Revenue", value: "€12k MRR" },
    ],
  },
];

export default function DiscoverPage() {
  const [cards, setCards] = useState(MOCK_CARDS);
  const [matches, setMatches] = useState<CardData[]>([]);
  const [lastAction, setLastAction] = useState<"pass" | "connect" | null>(null);

  function handlePass() {
    setLastAction("pass");
    setCards((prev) => prev.slice(1));
    setTimeout(() => setLastAction(null), 800);
  }

  function handleConnect() {
    setLastAction("connect");
    setMatches((prev) => [...prev, cards[0]]);
    setCards((prev) => prev.slice(1));
    setTimeout(() => setLastAction(null), 800);
  }

  const current = cards[0];

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 border border-white/15 rounded-full px-3 py-1">
          Student
        </span>
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm">
          A
        </div>
      </div>

      {/* Match flash */}
      {lastAction === "connect" && (
        <div className="mx-6 mb-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 text-sm text-green-400 text-center animate-pulse">
          ✓ Connected!
        </div>
      )}

      {/* Card area */}
      <div className="flex-1 flex flex-col px-5 pt-2">
        {current ? (
          <>
            <SwipeCard
              key={current.id}
              card={current}
              onPass={handlePass}
              onConnect={handleConnect}
            />

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-5 mt-6">
              <button
                onClick={handlePass}
                className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-red-400/60 hover:text-red-400 transition-colors text-2xl"
              >
                ✕
              </button>
              <button
                onClick={handleConnect}
                className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center text-[#0a0a0a] hover:bg-white/90 transition-colors text-2xl"
              >
                ♥
              </button>
              <button className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-white/40 transition-colors text-lg">
                ↑
              </button>
            </div>

            <p className="text-center text-[11px] text-white/20 mt-4 tracking-[0.1em] uppercase">
              {cards.length} left · {matches.length} connected
            </p>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold tracking-tight">You&apos;re all caught up</h2>
            <p className="text-sm text-white/40">
              {matches.length > 0
                ? `You connected with ${matches.length} people. Check your matches!`
                : "No more cards for now. Check back soon."}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
