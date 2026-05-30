"use client";

import { useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import NetworkGraph, { GraphEdge, GraphNode } from "@/components/NetworkGraph";
import InboxList from "@/components/InboxList";
import { fetchJson } from "@/lib/fetchJson";

// Demo graph used until a real one comes back from the API.
// Lets you see the look + the path animation without seed data in Supabase.
const ME_ID = "me";
const DEMO_NODES: GraphNode[] = [
  { id: ME_ID, label: "You", ring: 0 },
  { id: "alex", label: "Alex Tan", ring: 1, badge: "Eng" },
  { id: "lena", label: "Lena Müller", ring: 1, badge: "Student" },
  { id: "marco", label: "Marco Bianchi", ring: 1, badge: "Founder" },
  { id: "sarah", label: "Sarah L.", ring: 1, badge: "LegalTech" },
  { id: "jonas", label: "Jonas Weber", ring: 1, badge: "Climate" },
  { id: "ahmed", label: "Ahmed H.", ring: 1, badge: "Quantum" },

  { id: "kelly", label: "Kelly Park", ring: 2, parentId: "alex", badge: "BCI" },
  { id: "nora", label: "Nora R.", ring: 2, parentId: "alex", badge: "Hardware" },
  { id: "yuki", label: "Yuki S.", ring: 2, parentId: "lena", badge: "Fintech" },
  { id: "dario", label: "Dario M.", ring: 2, parentId: "marco", badge: "DTC" },
  { id: "elena", label: "Elena F.", ring: 2, parentId: "sarah", badge: "Lawyer" },
  { id: "tom", label: "Tom K.", ring: 2, parentId: "jonas", badge: "Climate" },
  { id: "rashid", label: "Rashid A.", ring: 2, parentId: "ahmed", badge: "Photonics" },
];
const DEMO_EDGES: GraphEdge[] = [
  { from: ME_ID, to: "alex" },
  { from: ME_ID, to: "lena" },
  { from: ME_ID, to: "marco" },
  { from: ME_ID, to: "sarah" },
  { from: ME_ID, to: "jonas" },
  { from: ME_ID, to: "ahmed" },
  { from: "alex", to: "kelly" },
  { from: "alex", to: "nora" },
  { from: "lena", to: "yuki" },
  { from: "marco", to: "dario" },
  { from: "sarah", to: "elena" },
  { from: "jonas", to: "tom" },
  { from: "ahmed", to: "rashid" },
];

type Suggestion = {
  bridgeId: string;
  targetId: string;
  reason: string;
  draftMessage: string;
  score: number;
  bridgeName?: string;
  targetName?: string;
};

type Stats = {
  profileEdges: number;
  externalEdges: number;
  externalContacts: number;
};

export default function ConnectionsHubPage() {
  const [view, setView] = useState<"network" | "inbox">("network");
  const [stats, setStats] = useState<Stats | null>(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [showImport, setShowImport] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchJson<Stats>("/api/connections").then((r) => {
      if (r.ok && r.data) setStats(r.data);
    });
  }, []);

  // The demo graph uses string ids that don't exist server-side — when we
  // get a real suggestion, we fall back to highlighting a deterministic
  // demo pair so the visual still moves. In production these would be real ids.
  const highlight = (() => {
    if (!suggestions?.length) return undefined;
    const demoPairs = [
      { bridgeId: "alex", targetId: "kelly" },
      { bridgeId: "jonas", targetId: "tom" },
      { bridgeId: "ahmed", targetId: "rashid" },
    ];
    return demoPairs[active % demoPairs.length];
  })();

  async function findConnection() {
    if (goal.trim().length < 5) return;
    setLoading(true);
    setError(null);
    setNote(null);
    setSuggestions(null);
    setActive(0);
    const r = await fetchJson<{ suggestions: Suggestion[]; note?: string }>(
      "/api/intros/suggest",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, save: false }),
      }
    );
    if (r.ok) {
      setSuggestions(r.data?.suggestions ?? []);
      if (r.data?.note) setNote(r.data.note);
    } else if (r.status === 401) {
      setError("Sign in to use the agent.");
    } else {
      setError(r.error ?? "Something went wrong");
    }
    setLoading(false);
  }

  async function send(s: Suggestion) {
    const key = `${s.bridgeId}:${s.targetId}`;
    setSending(key);
    const r = await fetchJson("/api/intros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bridgeId: s.bridgeId,
        targetProfileId: s.targetId,
        goal,
        context: s.reason,
        draftMessage: s.draftMessage,
      }),
    });
    if (r.ok) setSent((p) => new Set(p).add(key));
    else setError(r.error ?? "Failed to send");
    setSending(null);
  }

  async function handleCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetchJson<{ externalContacts: number }>("/api/connections/import", {
      method: "POST",
      body: fd,
    });
    if (r.ok && r.data) {
      setStats((prev) => prev && {
        ...prev,
        externalContacts: prev.externalContacts + r.data!.externalContacts,
      });
    } else {
      setError(r.error ?? "Import failed");
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[460px] mx-auto w-full flex flex-col pb-28 min-h-screen sm:border-x sm:border-white/6">
        <div className="px-6 pt-5 pb-3">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">
            Scout
          </span>
        </div>

        <div className="px-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Connect</h1>
          <p className="text-sm text-white/40 mb-4 leading-relaxed">
            Your network — and the people one hop past it.
          </p>

          {/* Network / Inbox toggle */}
          <div className="flex gap-1 border border-white/8 rounded-full p-1 mb-5">
            <button
              onClick={() => setView("network")}
              className={`flex-1 text-[11px] tracking-[0.1em] uppercase rounded-full py-1.5 transition-colors ${
                view === "network"
                  ? "bg-white text-[#0a0a0a] font-semibold"
                  : "text-white/55 hover:text-white"
              }`}
            >
              Network
            </button>
            <button
              onClick={() => setView("inbox")}
              className={`flex-1 text-[11px] tracking-[0.1em] uppercase rounded-full py-1.5 transition-colors ${
                view === "inbox"
                  ? "bg-white text-[#0a0a0a] font-semibold"
                  : "text-white/55 hover:text-white"
              }`}
            >
              Inbox
            </button>
          </div>

          {view === "inbox" ? (
            <InboxList />
          ) : (
            <>
          {/* Graph */}
          <div className="border border-white/10 rounded-3xl bg-gradient-to-b from-white/[0.03] to-transparent overflow-hidden">
            <NetworkGraph
              nodes={DEMO_NODES}
              edges={DEMO_EDGES}
              meId={ME_ID}
              highlight={highlight}
              height={360}
            />
            <div className="px-4 pb-3 -mt-2 flex items-center justify-between text-[10px] tracking-[0.12em] uppercase text-white/35">
              <span>
                <span className="text-white/80">{DEMO_NODES.filter((n) => n.ring === 1).length}</span> direct ·{" "}
                <span className="text-white/80">{DEMO_NODES.filter((n) => n.ring === 2).length}</span> 2-hop
              </span>
              {stats && (
                <span>
                  <span className="text-white/80">{stats.externalContacts}</span> contacts imported
                </span>
              )}
            </div>
          </div>

          {/* Goal input */}
          <div className="mt-6">
            <label className="text-[10px] tracking-[0.15em] uppercase text-white/40 mb-2 block">
              Who do you want to meet?
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. I want to break into neurotech — looking for founders building BCI"
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors resize-none"
            />
            <button
              onClick={findConnection}
              disabled={loading || goal.trim().length < 5}
              className="w-full mt-3 bg-white text-[#0a0a0a] rounded-full py-[14px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              {loading ? "Finding paths…" : "Find connection →"}
            </button>
          </div>

          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
          {note && !suggestions?.length && (
            <div className="mt-6 border border-white/10 rounded-xl p-4 text-sm text-white/50">
              {note}
            </div>
          )}

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="mt-7">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] tracking-[0.12em] uppercase text-white/40">
                  {suggestions.length} {suggestions.length === 1 ? "path" : "paths"} found
                </p>
                {suggestions.length > 1 && (
                  <div className="flex gap-1">
                    {suggestions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          i === active ? "bg-white" : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {suggestions.map((s, i) => {
                if (i !== active) return null;
                const key = `${s.bridgeId}:${s.targetId}`;
                const isSent = sent.has(key);
                return (
                  <div
                    key={key}
                    className="border border-white/15 rounded-2xl p-4 flex flex-col gap-3 bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-white font-semibold">You</span>
                      <span className="text-white/30">→</span>
                      <span className="text-white font-semibold">
                        {s.bridgeName ?? "Bridge"}
                      </span>
                      <span className="text-white/30">→</span>
                      <span className="text-white font-semibold">
                        {s.targetName ?? "Target"}
                      </span>
                      <span className="ml-auto text-[10px] text-white/40 border border-white/10 rounded-full px-2 py-0.5">
                        {(s.score * 100).toFixed(0)}%
                      </span>
                    </div>

                    <p className="text-sm text-white/70 leading-relaxed">
                      {s.reason}
                    </p>

                    <div className="border border-white/10 bg-white/[0.02] rounded-xl p-3">
                      <p className="text-[10px] tracking-[0.12em] uppercase text-white/35 mb-1.5">
                        Draft message
                      </p>
                      <p className="text-xs text-white/65 leading-relaxed whitespace-pre-wrap">
                        {s.draftMessage}
                      </p>
                    </div>

                    <button
                      onClick={() => send(s)}
                      disabled={isSent || sending === key}
                      className={`rounded-full py-2.5 text-xs font-semibold tracking-[0.05em] transition-colors ${
                        isSent
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-white text-[#0a0a0a] hover:opacity-90 disabled:opacity-50"
                      }`}
                    >
                      {isSent
                        ? "✓ Request sent"
                        : sending === key
                        ? "Sending…"
                        : `Connect via ${s.bridgeName ?? "bridge"}`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Import — collapsed by default */}
          <div className="mt-8 border border-white/8 rounded-2xl">
            <button
              onClick={() => setShowImport((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-white/70 hover:text-white"
            >
              <span>Grow your graph — import LinkedIn contacts</span>
              <span className="text-white/40 text-xs">{showImport ? "−" : "+"}</span>
            </button>
            {showImport && (
              <div className="px-4 pb-4 border-t border-white/8 pt-3">
                <p className="text-[11px] text-white/40 leading-relaxed mb-3">
                  LinkedIn → Settings → Data Privacy → Get a copy → Connections.
                  Only name, company, title, URL is stored.
                </p>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv"
                  onChange={handleCsv}
                  className="hidden"
                />
                <button
                  onClick={() => fileInput.current?.click()}
                  className="w-full bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-full py-2.5 text-xs font-semibold tracking-[0.05em] transition-colors"
                >
                  Upload Connections.csv
                </button>
              </div>
            )}
          </div>
          </>
          )}
        </div>

        <BottomNav />
      </div>
    </main>
  );
}
