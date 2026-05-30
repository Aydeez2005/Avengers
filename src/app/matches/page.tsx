"use client";

import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Builder matches (mock) ─────────────────────────────────────────────────

const MOCK_MATCHES = [
  { id: 1, name: "Lena Müller", tagline: "Full-stack engineer, ready to go all-in on a B2B SaaS idea.", time: "2m ago" },
  { id: 2, name: "Max Becker", tagline: "Ex-BCG consultant. Strong in strategy and ops.", time: "1h ago" },
];

// ── Types ──────────────────────────────────────────────────────────────────

type DbEvent = {
  id: string; name: string; date: string; location: string; topic: string;
  time?: string; description?: string; organiser?: string;
};

type DbProject = {
  id: string; name: string; deadline: string | null; budget: number | null;
  description: string; people_required: number; tags: string[];
};

type BusinessTab = "My Events" | "My Projects";

// ── Page ───────────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const [role, setRole] = useState<string | null>(null);
  const [businessTab, setBusinessTab] = useState<BusinessTab>("My Events");
  const [myEvents, setMyEvents] = useState<DbEvent[]>([]);
  const [myProjects, setMyProjects] = useState<DbProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const r = data.user?.user_metadata?.role ?? "builder";
      setRole(r);
      if (r === "business" || r === "admin") {
        Promise.all([
          fetch("/api/events?mine=true").then((res) => res.json()),
          fetch("/api/projects?mine=true").then((res) => res.json()),
        ]).then(([events, projects]) => {
          setMyEvents(Array.isArray(events) ? events : []);
          setMyProjects(Array.isArray(projects) ? projects : []);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  // ── Business view ──────────────────────────────────────────────────────

  if (role === "business" || role === "admin") return (
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
            {loading ? (
              <p className="text-sm text-white/30 py-10 text-center">Loading…</p>
            ) : myEvents.length === 0 ? (
              <p className="text-sm text-white/30 py-10 text-center">No events yet — create one from Discover.</p>
            ) : myEvents.map((e) => (
              <div key={e.id} className="border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm text-white">{e.name}</span>
                  <span className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">{e.date}</span>
                </div>
                <p className="text-xs text-white/40 mb-1">📍 {e.location}{e.topic ? ` · ${e.topic}` : ""}</p>
                {e.description && <p className="text-xs text-white/30 mb-3 line-clamp-2">{e.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* My Projects */}
        {businessTab === "My Projects" && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-white/30 py-10 text-center">Loading…</p>
            ) : myProjects.length === 0 ? (
              <p className="text-sm text-white/30 py-10 text-center">No projects yet — post one from Discover.</p>
            ) : myProjects.map((p) => (
              <div key={p.id} className="border border-white/10 rounded-2xl p-4 hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm text-white">{p.name}</span>
                  {p.budget != null && (
                    <span className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">€{p.budget.toLocaleString()}</span>
                  )}
                </div>
                {p.deadline && <p className="text-xs text-white/40 mb-2">Due {p.deadline}</p>}
                {p.description && <p className="text-xs text-white/30 mb-2 line-clamp-2">{p.description}</p>}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] text-white/50 border border-white/10 rounded-full px-2 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
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
