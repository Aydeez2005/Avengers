"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

type Person = {
  id: string;
  full_name: string | null;
  headline: string | null;
  current_company: string | null;
  current_title: string | null;
  calendly_url: string | null;
} | null;

type Intro = {
  id: string;
  goal: string;
  context: string | null;
  draft_message: string | null;
  status: string;
  requester_id: string;
  bridge_id: string;
  target_profile_id: string | null;
};

type IntroBundle = {
  intro: Intro;
  requester: Person;
  bridge: Person;
  target: Person;
  role: "requester" | "bridge" | "target";
};

type Message = {
  id: string;
  intro_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function IntroThreadPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [bundle, setBundle] = useState<IntroBundle | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    const [introRes, msgRes] = await Promise.all([
      fetch(`/api/intros/${id}`),
      fetch(`/api/intros/${id}/messages`),
    ]);
    if (!introRes.ok) {
      const j = await introRes.json();
      setError(j.error ?? "Couldn't load");
      return;
    }
    const b: IntroBundle = await introRes.json();
    setBundle(b);
    if (msgRes.ok) {
      const j = await msgRes.json();
      setMessages(j.messages ?? []);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/intros/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const j = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, j.message]);
        setDraft("");
      } else {
        setError(j.error ?? "Send failed");
      }
    } finally {
      setSending(false);
    }
  }

  async function act(action: "accept" | "decline") {
    const res = await fetch(`/api/intros/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) load();
    else setError((await res.json()).error ?? "Action failed");
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-[460px] mx-auto px-6 pt-10 text-sm text-red-400">{error}</div>
      </main>
    );
  }
  if (!bundle) {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-[460px] mx-auto px-6 pt-10 text-sm text-white/40">Loading…</div>
      </main>
    );
  }

  const { intro, requester, bridge, target, role } = bundle;
  const canBridgeAct = role === "bridge" && intro.status === "pending";
  const canTargetAct = role === "target" && intro.status === "forwarded";
  const closed = intro.status === "declined" || intro.status === "expired";
  const open = intro.status === "forwarded" || intro.status === "connected";
  const calendlyTarget = target?.calendly_url ?? null;
  const calendlyVisible =
    intro.status === "connected" || (intro.status === "forwarded" && role === "target");

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[460px] mx-auto w-full flex flex-col pb-28 min-h-screen sm:border-x sm:border-white/6">
        {/* Top */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/70 transition-colors"
          >
            ← Back
          </button>
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">
            Scout
          </span>
          <span className="w-12" />
        </div>

        {/* Path header */}
        <div className="px-6">
          <div className="border border-white/10 rounded-2xl p-4 bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="flex items-center justify-between text-xs text-white/85 mb-3">
              <PathNode person={requester} label="Requester" />
              <span className="text-white/25">→</span>
              <PathNode person={bridge} label="Bridge" highlight />
              <span className="text-white/25">→</span>
              <PathNode person={target} label="Target" />
            </div>
            <p className="text-[10px] tracking-[0.12em] uppercase text-white/35 mb-1">
              Goal
            </p>
            <p className="text-sm text-white/85 leading-snug">{intro.goal}</p>
            {intro.context && (
              <p className="text-xs text-white/45 mt-2 leading-relaxed">{intro.context}</p>
            )}
          </div>
        </div>

        {/* Status callouts */}
        <div className="px-6 mt-4 flex flex-col gap-2">
          {intro.status === "pending" && role === "bridge" && (
            <CalloutAction
              text="Forward this intro to the target?"
              onYes={() => act("accept")}
              onNo={() => act("decline")}
            />
          )}
          {intro.status === "pending" && role !== "bridge" && (
            <Callout color="amber" text={`Waiting for ${bridge?.full_name ?? "the bridge"} to forward.`} />
          )}
          {intro.status === "forwarded" && role === "target" && (
            <CalloutAction
              text="Accept this intro and open the conversation?"
              onYes={() => act("accept")}
              onNo={() => act("decline")}
            />
          )}
          {intro.status === "forwarded" && role !== "target" && (
            <Callout color="sky" text="Forwarded — waiting for the target to reply." />
          )}
          {intro.status === "connected" && (
            <Callout color="green" text="✓ Connected. Both sides can now message and book time." />
          )}
          {intro.status === "declined" && (
            <Callout color="muted" text="This intro was declined." />
          )}
        </div>

        {/* Calendly */}
        {calendlyVisible && calendlyTarget && (
          <div className="px-6 mt-3">
            <a
              href={calendlyTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white text-[#0a0a0a] rounded-full py-3 text-center text-sm font-semibold tracking-[0.05em] hover:opacity-90 transition-opacity"
            >
              Book 15 min with {target?.full_name?.split(" ")[0] ?? "them"} →
            </a>
          </div>
        )}

        {/* Thread */}
        <div className="px-6 mt-6">
          <p className="text-[10px] tracking-[0.12em] uppercase text-white/35 mb-3">Thread</p>
          <div
            ref={scrollRef}
            className="border border-white/8 rounded-2xl p-3 max-h-[340px] overflow-y-auto flex flex-col gap-2 bg-white/[0.02]"
          >
            {messages.length === 0 ? (
              <p className="text-xs text-white/30 text-center py-6">
                {open ? "Say hi — start the conversation." : "Once the bridge forwards, the thread opens here."}
              </p>
            ) : (
              messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  msg={m}
                  bundle={bundle}
                />
              ))
            )}
          </div>
        </div>

        {/* Composer */}
        {open && !closed && (
          <div className="px-6 mt-3 flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Write something…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={send}
              disabled={!draft.trim() || sending}
              className="bg-white text-[#0a0a0a] rounded-full px-4 text-sm font-semibold disabled:opacity-30 hover:opacity-90 transition-opacity"
            >
              {sending ? "…" : "Send"}
            </button>
          </div>
        )}

        <BottomNav />
      </div>
    </main>
  );
}

function PathNode({ person, label, highlight }: { person: Person; label: string; highlight?: boolean }) {
  const initials = person?.full_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold ${
          highlight
            ? "bg-white text-[#0a0a0a]"
            : "bg-white/8 border border-white/15 text-white"
        }`}
      >
        {initials}
      </div>
      <p className="text-[10px] text-white/55 truncate w-full text-center">
        {person?.full_name ?? "—"}
      </p>
      <p className="text-[8px] tracking-[0.12em] uppercase text-white/30">{label}</p>
    </div>
  );
}

function Callout({ text, color }: { text: string; color: "amber" | "sky" | "green" | "muted" }) {
  const cls = {
    amber: "bg-amber-400/10 border-amber-400/30 text-amber-300",
    sky: "bg-sky-400/10 border-sky-400/30 text-sky-300",
    green: "bg-green-500/10 border-green-500/30 text-green-300",
    muted: "bg-white/5 border-white/10 text-white/45",
  }[color];
  return (
    <div className={`border rounded-xl px-4 py-2.5 text-sm ${cls}`}>{text}</div>
  );
}

function CalloutAction({
  text,
  onYes,
  onNo,
}: {
  text: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <div className="border border-white/15 bg-white/[0.04] rounded-xl px-4 py-3 flex items-center gap-3">
      <p className="text-sm text-white/85 flex-1">{text}</p>
      <button
        onClick={onNo}
        className="text-xs text-white/50 hover:text-red-400 transition-colors"
      >
        Decline
      </button>
      <button
        onClick={onYes}
        className="text-xs font-semibold bg-white text-[#0a0a0a] rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity"
      >
        Yes
      </button>
    </div>
  );
}

function MessageBubble({ msg, bundle }: { msg: Message; bundle: IntroBundle }) {
  const me = bundle.role === "requester"
    ? bundle.intro.requester_id
    : bundle.role === "bridge"
    ? bundle.intro.bridge_id
    : bundle.intro.target_profile_id;
  const isMe = msg.sender_id === me;
  const sender =
    msg.sender_id === bundle.intro.requester_id ? bundle.requester :
    msg.sender_id === bundle.intro.bridge_id ? bundle.bridge :
    bundle.target;
  const name = sender?.full_name ?? "?";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 ${
          isMe
            ? "bg-white text-[#0a0a0a]"
            : "bg-white/[0.06] border border-white/10 text-white"
        }`}
      >
        {!isMe && (
          <p className="text-[9px] tracking-[0.1em] uppercase text-white/40 mb-0.5">
            {name}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
      </div>
    </div>
  );
}
