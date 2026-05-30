"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import SwipeCard, { CardData } from "@/components/SwipeCard";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

export type EventData = {
  id: number;
  name: string;
  organiser: string;
  date: string;
  time: string;
  location: string;
  tags: string[];
  description: string;
  attendees: number;
};

type RoleKey = "founder" | "builder" | "researcher" | "startup" | "corporate";
type Tab = "Co-founders" | "Events" | "Projects" | "Find Talent";

const ROLE_TABS: Record<RoleKey, Tab[]> = {
  founder:    ["Co-founders", "Events"],
  builder:    ["Co-founders", "Projects", "Events"],
  researcher: ["Co-founders", "Events"],
  startup:    ["Find Talent", "Events"],
  corporate:  ["Find Talent", "Events"],
};

const ROLE_LABELS: Record<RoleKey, string> = {
  founder:    "Founder",
  builder:    "Builder",
  researcher: "Researcher",
  startup:    "Startup",
  corporate:  "Corporate",
};

// ── Mock data ──────────────────────────────────────────────────────────────

const COFOUNDERS: CardData[] = [
  {
    id: 101,
    type: "Co-founder",
    name: "Lena Müller",
    tagline: "Full-stack engineer with 4 years at Zalando. Ready to go all-in on a B2B SaaS idea.",
    location: "Berlin",
    tags: ["Engineering", "B2B SaaS", "Fintech"],
    lookingFor: "A visionary founder with a problem worth solving",
    meta: [
      { label: "Skills", value: "Full-stack" },
      { label: "Availability", value: "Full-time" },
      { label: "Equity", value: "Open" },
    ],
  },
  {
    id: 102,
    type: "Co-founder",
    name: "Max Becker",
    tagline: "Ex-BCG consultant, domain expert in healthcare. Looking for a technical co-founder.",
    location: "Berlin",
    tags: ["HealthTech", "Strategy", "B2B"],
    lookingFor: "Technical co-founder to build together",
    meta: [
      { label: "Background", value: "Consulting" },
      { label: "Availability", value: "Full-time" },
      { label: "Equity", value: "50/50" },
    ],
  },
  {
    id: 103,
    type: "Co-founder",
    name: "Aisha Ndiaye",
    tagline: "ML engineer, PhD in Computer Vision from TU Berlin. Looking for a business co-founder.",
    location: "Berlin",
    tags: ["AI / ML", "Deep Tech", "Computer Vision"],
    lookingFor: "Business co-founder to commercialise AI research",
    meta: [
      { label: "Skills", value: "ML / AI" },
      { label: "Availability", value: "Part-time" },
      { label: "Equity", value: "Open" },
    ],
  },
];

const PROJECTS: CardData[] = [
  {
    id: 201,
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
    id: 202,
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
];


const TALENT: CardData[] = [
  {
    id: 401,
    type: "Co-founder",
    name: "Jonas Weber",
    tagline: "Ex-McKinsey, 5 years in product strategy. Looking for an ambitious team to join.",
    location: "Berlin",
    tags: ["Strategy", "Product", "B2B"],
    lookingFor: "Challenging role at an early-stage startup",
    meta: [
      { label: "Background", value: "Consulting" },
      { label: "Availability", value: "Full-time" },
      { label: "Notice", value: "1 month" },
    ],
  },
  {
    id: 402,
    type: "Student",
    name: "Kai Hoffmann",
    tagline: "MSc CS @ TU Berlin, specialising in distributed systems. Open to startup roles.",
    location: "Berlin",
    tags: ["Backend", "Systems", "Python / Go"],
    lookingFor: "Engineering role at a mission-driven startup",
    meta: [
      { label: "University", value: "TU Berlin" },
      { label: "Availability", value: "Part-time" },
      { label: "Graduation", value: "Dec 2026" },
    ],
  },
];

const EVENTS: EventData[] = [
  {
    id: 501,
    name: "BAD1 Demo Night",
    organiser: "BAD1",
    date: "31 May 2026",
    time: "18:00",
    location: "Factory Berlin, Mitte",
    tags: ["Startup", "Demo", "Networking"],
    description: "The flagship BAD1 event. Startups pitch, builders connect, deals get made.",
    attendees: 340,
  },
  {
    id: 502,
    name: "Founder Breakfast",
    organiser: "Berlin Founders Club",
    date: "5 June 2026",
    time: "08:30",
    location: "Soho House Berlin",
    tags: ["Founders", "Early Stage", "Breakfast"],
    description: "Intimate breakfast for early-stage founders. Max 30 people, deep conversations.",
    attendees: 28,
  },
  {
    id: 503,
    name: "Deep Tech Meetup",
    organiser: "Berlin Deep Tech",
    date: "12 June 2026",
    time: "19:00",
    location: "TU Berlin, Main Building",
    tags: ["Deep Tech", "Quantum", "Hardware"],
    description: "Researchers and founders connecting around hard problems in quantum, robotics, and materials.",
    attendees: 120,
  },
];

const CARDS_BY_TAB: Partial<Record<Tab, CardData[]>> = {
  "Co-founders": COFOUNDERS,
  "Projects":    PROJECTS,
  "Find Talent": TALENT,
};

// ── Sub-components ─────────────────────────────────────────────────────────

function EventCard({ event, joined, onJoin }: { event: EventData; joined: boolean; onJoin: () => void }) {
  if (joined) {
    return (
      <div className="border border-green-500/30 bg-green-500/5 rounded-3xl px-5 py-4 flex items-center gap-3">
        <span className="text-green-400 text-lg">✓</span>
        <div>
          <p className="text-sm font-semibold text-white">{event.name}</p>
          <p className="text-xs text-white/40">{event.date} · {event.time}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="border border-white/10 rounded-3xl bg-[#111] overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">
            {event.organiser}
          </span>
          <span className="text-[11px] text-white/40">📍 {event.location.split(",")[0]}</span>
        </div>
        <h2 className="text-[22px] font-bold tracking-tight leading-tight mb-1">{event.name}</h2>
        <p className="text-sm text-white/50 leading-relaxed">{event.description}</p>
      </div>
      <div className="flex gap-5 px-5 pb-4">
        {[["Date", event.date], ["Time", event.time], ["Going", String(event.attendees)]].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/35">{label}</span>
            <span className="text-[13px] font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 px-5 pb-4">
        {event.tags.map((tag) => (
          <span key={tag} className="text-[11px] text-white/70 border border-white/15 rounded-full px-2.5 py-0.5">{tag}</span>
        ))}
      </div>
      <div className="px-5 pb-5">
        <button onClick={onJoin} className="w-full py-3 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold tracking-wide hover:bg-white/90 transition-colors">
          Join event →
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const [role, setRole] = useState<RoleKey | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewingAs, setViewingAs] = useState<RoleKey>("founder");
  const [activeTab, setActiveTab] = useState<Tab>("Co-founders");
  const [cardStacks, setCardStacks] = useState<Record<Tab, CardData[]>>({
    "Co-founders": COFOUNDERS,
    "Projects":    PROJECTS,
    "Find Talent": TALENT,
    "Events":      [],
  });
  const [connectCounts, setConnectCounts] = useState<Record<Tab, number>>({
    "Co-founders": 0, "Projects": 0, "Find Talent": 0, "Events": 0,
  });
  const [joinedEvents, setJoinedEvents] = useState<Set<number>>(new Set());
  const [lastAction, setLastAction] = useState<"pass" | "connect" | null>(null);
  const [userInitial, setUserInitial] = useState("·");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      const name = meta.full_name ?? data.user?.email ?? "";
      if (name) setUserInitial(name[0].toUpperCase());

      const userRole = meta.role as string;
      if (userRole === "admin") {
        setIsAdmin(true);
        setViewingAs("founder");
      } else {
        setRole((userRole as RoleKey) ?? "founder");
      }
    });
  }, []);

  const effectiveRole: RoleKey = isAdmin ? viewingAs : (role ?? "founder");
  const tabs = ROLE_TABS[effectiveRole];

  // Reset to first tab when effective role changes
  useEffect(() => {
    setActiveTab(ROLE_TABS[effectiveRole][0]);
  }, [effectiveRole]);

  function handlePass() {
    setLastAction("pass");
    setCardStacks((prev) => ({ ...prev, [activeTab]: prev[activeTab].slice(1) }));
    setTimeout(() => setLastAction(null), 800);
  }

  function handleConnect() {
    setLastAction("connect");
    setConnectCounts((prev) => ({ ...prev, [activeTab]: prev[activeTab] + 1 }));
    setCardStacks((prev) => ({ ...prev, [activeTab]: prev[activeTab].slice(1) }));
    setTimeout(() => setLastAction(null), 800);
  }

  const currentCard = activeTab !== "Events" ? cardStacks[activeTab]?.[0] : undefined;

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm">
          {userInitial}
        </div>
      </div>

      {/* Admin role switcher */}
      {isAdmin && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 flex-shrink-0">Viewing as</span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {(Object.keys(ROLE_LABELS) as RoleKey[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setViewingAs(r)}
                  className={`flex-shrink-0 text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full border transition-colors ${
                    viewingAs === r
                      ? "border-white/50 bg-white/10 text-white"
                      : "border-white/10 text-white/35 hover:text-white/60"
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode tabs */}
      <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 text-[11px] tracking-[0.15em] uppercase px-3.5 py-1.5 rounded-full border transition-colors ${
              activeTab === tab
                ? "border-white/60 text-white bg-white/10"
                : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/30"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Connect flash */}
      {lastAction === "connect" && (
        <div className="mx-6 mb-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 text-sm text-green-400 text-center animate-pulse">
          ✓ Connected!
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pt-2">

        {/* Swipeable tabs */}
        {activeTab !== "Events" && (
          currentCard ? (
            <>
              <SwipeCard
                key={currentCard.id}
                card={currentCard}
                onPass={handlePass}
                onConnect={handleConnect}
              />
              <div className="flex items-center justify-center gap-5 mt-6">
                <button onClick={handlePass} className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-red-400/60 hover:text-red-400 transition-colors text-2xl">✕</button>
                <button onClick={handleConnect} className="w-[68px] h-[68px] rounded-full bg-white flex items-center justify-center text-[#0a0a0a] hover:bg-white/90 transition-colors text-2xl">♥</button>
                <button className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-white/40 transition-colors text-lg">↑</button>
              </div>
              <p className="text-center text-[11px] text-white/20 mt-4 tracking-[0.1em] uppercase">
                {cardStacks[activeTab].length} left · {connectCounts[activeTab]} connected
              </p>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
              <div className="text-4xl">🎉</div>
              <h2 className="text-xl font-bold tracking-tight">You&apos;re all caught up</h2>
              <p className="text-sm text-white/40">
                {connectCounts[activeTab] > 0
                  ? `You connected with ${connectCounts[activeTab]} people. Check your matches!`
                  : "No more profiles for now. Check back soon."}
              </p>
            </div>
          )
        )}

        {/* Events tab */}
        {activeTab === "Events" && (
          <div className="flex flex-col gap-4 pb-4">
            {EVENTS.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                joined={joinedEvents.has(event.id)}
                onJoin={() => setJoinedEvents((prev) => new Set([...prev, event.id]))}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
