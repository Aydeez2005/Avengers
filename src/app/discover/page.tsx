"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import SwipeCard, { CardData } from "@/components/SwipeCard";

const MODES = ["Co-founders", "Projects", "Jobs", "Research"] as const;
type Mode = typeof MODES[number];

const CARDS_BY_MODE: Record<Mode, CardData[]> = {
  "Co-founders": [
    {
      id: 1,
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
      id: 2,
      type: "Co-founder",
      name: "Sara Kim",
      tagline: "Product designer turned founder. Ex-Zalando. Building in consumer health.",
      location: "Berlin",
      tags: ["Health", "Consumer", "Design"],
      lookingFor: "Technical Co-founder",
      meta: [
        { label: "Background", value: "Product" },
        { label: "Stage", value: "Pre-idea" },
        { label: "Equity", value: "Open" },
      ],
    },
  ],
  "Projects": [
    {
      id: 3,
      type: "Startup",
      name: "Clausify",
      tagline: "AI that reads contracts so lawyers don't have to",
      location: "Berlin",
      tags: ["AI / ML", "LegalTech", "B2B SaaS"],
      lookingFor: "ML Engineer — part-time or internship",
      meta: [
        { label: "Stage", value: "Pre-seed" },
        { label: "Team", value: "2 founders" },
        { label: "Pay", value: "Paid" },
      ],
    },
    {
      id: 4,
      type: "Startup",
      name: "Rootly",
      tagline: "Making urban farming accessible for apartment dwellers across Europe",
      location: "Berlin",
      tags: ["AgriTech", "Consumer", "Hardware"],
      lookingFor: "Growth / Marketing — 20h/week",
      meta: [
        { label: "Stage", value: "Seed" },
        { label: "Team", value: "4 people" },
        { label: "Revenue", value: "€12k MRR" },
      ],
    },
    {
      id: 5,
      type: "Student",
      name: "Lena Müller",
      tagline: "MSc CS @ TU Berlin. Building a fintech side project, need a design partner.",
      location: "Berlin",
      tags: ["Fintech", "Side Project", "Open Source"],
      lookingFor: "UI/UX or frontend dev to co-build",
      meta: [
        { label: "University", value: "TU Berlin" },
        { label: "Hours", value: "10h/week" },
        { label: "Pay", value: "Equity" },
      ],
    },
  ],
  "Jobs": [
    {
      id: 6,
      type: "Startup",
      name: "Volara",
      tagline: "Next-gen mobility data platform for European cities",
      location: "Berlin",
      tags: ["Mobility", "SaaS", "Enterprise"],
      lookingFor: "Senior Backend Engineer (Go / Rust)",
      meta: [
        { label: "Stage", value: "Series A" },
        { label: "Team", value: "18 people" },
        { label: "Salary", value: "€90–110k" },
      ],
    },
    {
      id: 7,
      type: "Startup",
      name: "Clausify",
      tagline: "AI that reads contracts so lawyers don't have to",
      location: "Berlin",
      tags: ["AI / ML", "LegalTech", "B2B SaaS"],
      lookingFor: "Full-stack Engineer — founding team",
      meta: [
        { label: "Stage", value: "Pre-seed" },
        { label: "Equity", value: "0.5–2%" },
        { label: "Salary", value: "€60–80k" },
      ],
    },
  ],
  "Research": [
    {
      id: 8,
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
      id: 9,
      type: "Researcher",
      name: "Prof. Ingrid Baum",
      tagline: "NLP research lead at FU Berlin. Open to industry collaboration on LLM alignment.",
      location: "Berlin",
      tags: ["NLP", "AI Safety", "LLMs"],
      lookingFor: "Industry partner for applied research",
      meta: [
        { label: "Institution", value: "FU Berlin" },
        { label: "Field", value: "NLP / AI" },
        { label: "Papers", value: "40+" },
      ],
    },
  ],
};

export default function DiscoverPage() {
  const [mode, setMode] = useState<Mode>("Co-founders");
  const [cardStacks, setCardStacks] = useState<Record<Mode, CardData[]>>(CARDS_BY_MODE);
  const [matchCounts, setMatchCounts] = useState<Record<Mode, number>>({ "Co-founders": 0, "Projects": 0, "Jobs": 0, "Research": 0 });
  const [lastAction, setLastAction] = useState<"pass" | "connect" | null>(null);

  const cards = cardStacks[mode];
  const current = cards[0];

  function handlePass() {
    setLastAction("pass");
    setCardStacks((prev) => ({ ...prev, [mode]: prev[mode].slice(1) }));
    setTimeout(() => setLastAction(null), 800);
  }

  function handleConnect() {
    setLastAction("connect");
    setMatchCounts((prev) => ({ ...prev, [mode]: prev[mode] + 1 }));
    setCardStacks((prev) => ({ ...prev, [mode]: prev[mode].slice(1) }));
    setTimeout(() => setLastAction(null), 800);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm">
          A
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
        {MODES.map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-shrink-0 text-[11px] tracking-[0.15em] uppercase px-3.5 py-1.5 rounded-full border transition-colors ${
              mode === m
                ? "border-white/60 text-white bg-white/10"
                : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/30"
            }`}
          >
            {m}
          </button>
        ))}
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
              {cards.length} left · {matchCounts[mode]} connected
            </p>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="text-4xl">🎉</div>
            <h2 className="text-xl font-bold tracking-tight">You&apos;re all caught up</h2>
            <p className="text-sm text-white/40">
              {matchCounts[mode] > 0
                ? `You connected with ${matchCounts[mode]} people in ${mode}. Check your matches!`
                : "No more cards for now. Check back soon."}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
