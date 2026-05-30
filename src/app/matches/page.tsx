"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Mock business data ─────────────────────────────────────────────────────

const MOCK_MY_EVENTS = [
  { id: 1, name: "BAD1 Hackathon", date: "31 May 2026", location: "Factory Berlin", registrations: 47, topic: "AI · ClimateTech" },
  { id: 2, name: "AI Workshop", date: "7 June 2026", location: "Soho House Berlin", registrations: 18, topic: "AI · Product" },
];

const MOCK_MY_PROJECTS = [
  { id: 1, name: "ML Contract Parser", deadline: "30 June 2026", budget: "€3,000", applicants: 5, tags: ["AI", "NLP"] },
  { id: 2, name: "IoT Sensor Dashboard", deadline: "15 July 2026", budget: "€2,000", applicants: 3, tags: ["IoT", "React"] },
];

// ── Builder matches ────────────────────────────────────────────────────────

const MOCK_MATCHES = [
  { id: 1, name: "Lena Müller", tagline: "Full-stack engineer, ready to go all-in on a B2B SaaS idea.", time: "2m ago" },
  { id: 2, name: "Max Becker", tagline: "Ex-BCG consultant. Strong in strategy and ops.", time: "1h ago" },
];

// ── Page ───────────────────────────────────────────────────────────────────

type BusinessTab = "My Events" | "My Projects";

export default function MatchesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [businessTab, setBusinessTab] = useState<BusinessTab>("My Events");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setRole(data.user?.user_metadata?.role ?? "builder");
    });
  }, []);

  // ── Business view ──────────────────────────────────────────────────────

  if (role === "business") return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      <div className="px-6 pt-5 pb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
      </div>

      <div className="px-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["My Events", "My Projects"] as BusinessTab[]).map((tab) => (
            <button key={tab} onClick={() => setBusinessTab(tab)}
              className={`text-[11px] tracking-[0.15em] uppercase px-3.5 py-1.5 rounded-full border transition-colors ${
                businessTab === tab ? "border-white/60 text-white bg-white/10" : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/30"
              }`}>
              {tab}
            </button>
          ))}
        </div>

        {/* My Events */}
        {businessTab === "My Events" && (
          <div className="flex flex-col gap-3">
            {MOCK_MY_EVENTS.length === 0 ? (
              <p className="text-sm text-white/30 py-10 text-center">No events yet — create one from Discover.</p>
            ) : MOCK_MY_EVENTS.map((e) => (
              <div key={e.id} className="border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm text-white">{e.name}</span>
                  <span className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">{e.date}</span>
                </div>
                <p className="text-xs text-white/40 mb-3">📍 {e.location} · {e.topic}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">{e.registrations} registered</span>
                  <div className="flex-1 h-px bg-white/8" />
                  <button className="text-[11px] text-white/50 hover:text-white transition-colors">Manage →</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* My Projects */}
        {businessTab === "My Projects" && (
          <div className="flex flex-col gap-3">
            {MOCK_MY_PROJECTS.length === 0 ? (
              <p className="text-sm text-white/30 py-10 text-center">No projects yet — post one from Discover.</p>
            ) : MOCK_MY_PROJECTS.map((p) => (
              <div key={p.id} className="border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm text-white">{p.name}</span>
                  <span className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">{p.budget}</span>
                </div>
                <p className="text-xs text-white/40 mb-2">Due {p.deadline}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[10px] text-white/50 border border-white/10 rounded-full px-2 py-0.5">{t}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">{p.applicants} applicants</span>
                  <div className="flex-1 h-px bg-white/8" />
                  <button className="text-[11px] text-white/50 hover:text-white transition-colors">View →</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );

  // ── Builder view ───────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      <div className="px-6 pt-5 pb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
      </div>

      <div className="px-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matches</h1>
        <p className="text-sm text-white/40 mb-6">People who connected back with you</p>

        {MOCK_MATCHES.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
            <div className="text-4xl">💬</div>
            <p className="text-sm text-white/40">No matches yet — keep swiping!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {MOCK_MATCHES.map((m) => (
              <div key={m.id} className="flex items-center gap-4 border border-white/10 rounded-2xl p-4 hover:border-white/25 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                  🤝
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white truncate">{m.name}</span>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{m.time}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-0.5 truncate">{m.tagline}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
