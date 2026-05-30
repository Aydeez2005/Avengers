"use client";

import { useEffect, useRef, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────

type Profile = {
  id: string; full_name: string; has_idea: boolean | null;
  categories: string[] | null; tagline: string | null; location: string | null;
};

type Invite = {
  id: string; sender_id: string; created_at: string; status: string; sender: Profile | null;
};

type Match = {
  id: string; user_id_1: string; user_id_2: string; created_at: string; partner: Profile | null;
};

type Message = {
  id: string; sender_id: string; content: string; created_at: string;
};

// ── Chat view ──────────────────────────────────────────────────────────────

function ChatView({ match, currentUserId, onBack }: { match: Match; currentUserId: string; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load initial messages
    fetch(`/api/messages/${match.id}`)
      .then((r) => r.json())
      .then((msgs) => { if (Array.isArray(msgs)) setMessages(msgs); });

    // Real-time subscription
    const channel = supabase
      .channel(`match:${match.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${match.id}` },
        (payload) => { setMessages((prev) => [...prev, payload.new as Message]); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    await fetch(`/api/messages/${match.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSending(false);
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  const partner = match.partner;

  return (
    <main className="fixed inset-0 bg-[#0a0a0a] flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 border-b border-white/8">
        <button onClick={onBack} className="text-white/40 hover:text-white transition-colors p-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <div className="w-9 h-9 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {partner?.full_name?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{partner?.full_name ?? "Builder"}</p>
          {partner?.tagline && <p className="text-[11px] text-white/40 truncate max-w-[200px]">{partner.tagline}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-white/30 text-center">
              You matched with {partner?.full_name ?? "this builder"}.<br/>Say hello! 👋
            </p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? "bg-white text-[#0a0a0a] rounded-br-sm"
                  : "bg-white/10 text-white rounded-bl-sm"
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-1 ${isMe ? "text-black/40" : "text-white/30"}`}>
                  {formatTime(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-8 pt-3 border-t border-white/8 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Message…"
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
        />
        <button
          onClick={sendMessage}
          disabled={!text.trim() || sending}
          className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#0a0a0a] disabled:opacity-30 hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>
    </main>
  );
}

// ── Main matches page ──────────────────────────────────────────────────────

export default function MatchesPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChat, setActiveChat] = useState<Match | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id);
    });

    Promise.all([
      fetch("/api/match-invites").then((r) => r.json()),
      fetch("/api/matches").then((r) => r.json()),
    ]).then(([invs, mtchs]) => {
      setInvites(Array.isArray(invs) ? invs : []);
      setMatches(Array.isArray(mtchs) ? mtchs : []);
      setLoading(false);
    });
  }, []);

  async function handleInvite(inviteId: string, status: "accepted" | "declined") {
    const res = await fetch(`/api/match-invites/${inviteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    setInvites((prev) => prev.filter((i) => i.id !== inviteId));
    if (status === "accepted" && json.match) {
      // Reload matches to include new partner profile
      fetch("/api/matches").then((r) => r.json()).then((mtchs) => {
        if (Array.isArray(mtchs)) setMatches(mtchs);
      });
    }
  }

  if (activeChat && currentUserId) {
    return <ChatView match={activeChat} currentUserId={currentUserId} onBack={() => setActiveChat(null)} />;
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      <div className="px-6 pt-5 pb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
      </div>

      <div className="px-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matches</h1>
        <p className="text-sm text-white/40 mb-6">Connect with people in the BAD1 ecosystem</p>

        {loading ? (
          <p className="text-sm text-white/30 text-center py-10">Loading…</p>
        ) : (
          <>
            {/* Pending invites */}
            {invites.length > 0 && (
              <div className="mb-6">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">
                  Pending ({invites.length})
                </p>
                <div className="flex flex-col gap-3">
                  {invites.map((inv) => (
                    <div key={inv.id} className="border border-white/15 rounded-2xl p-4 bg-white/[0.02]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {inv.sender?.full_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white">{inv.sender?.full_name ?? "Builder"}</p>
                          <p className="text-xs text-white/40 truncate">
                            {inv.sender?.tagline ?? (inv.sender?.categories?.join(", ") ?? "Builder")}
                          </p>
                        </div>
                        <span className="text-[10px] text-white/25 flex-shrink-0">
                          {new Date(inv.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleInvite(inv.id, "declined")}
                          className="flex-1 py-2 rounded-xl border border-white/10 text-xs text-white/40 hover:border-red-400/40 hover:text-red-400 transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleInvite(inv.id, "accepted")}
                          className="flex-1 py-2 rounded-xl bg-white text-[#0a0a0a] text-xs font-semibold hover:bg-white/90 transition-colors"
                        >
                          Accept ♥
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted matches */}
            {matches.length > 0 && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">
                  Matched ({matches.length})
                </p>
                <div className="flex flex-col gap-3">
                  {matches.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setActiveChat(m)}
                      className="flex items-center gap-4 border border-white/10 rounded-2xl p-4 hover:border-white/25 hover:bg-white/[0.02] transition-all text-left w-full"
                    >
                      <div className="w-11 h-11 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                        {m.partner?.full_name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{m.partner?.full_name ?? "Builder"}</p>
                        <p className="text-xs text-white/40 truncate">
                          {m.partner?.tagline ?? (m.partner?.categories?.join(", ") ?? "Builder")}
                        </p>
                      </div>
                      <svg className="text-white/20 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M12 5l7 7-7 7"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {invites.length === 0 && matches.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
                <div className="text-4xl">💬</div>
                <h2 className="text-lg font-bold tracking-tight">No matches yet</h2>
                <p className="text-sm text-white/40">Swipe on co-founders in Discover to send match invites.</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
