"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/fetchJson";

type Intro = {
  id: string;
  requester_id: string;
  bridge_id: string;
  target_profile_id: string | null;
  goal: string;
  context: string | null;
  draft_message: string | null;
  status: string;
  created_at: string;
};

type Role = "bridge" | "target" | "requester";

const TABS: { id: Role; label: string; hint: string }[] = [
  { id: "bridge",    label: "To forward",   hint: "people asking you for intros" },
  { id: "target",    label: "Coming to you", hint: "intros made for you" },
  { id: "requester", label: "Your asks",    hint: "intros you've requested" },
];

export default function InboxList() {
  const [tab, setTab] = useState<Role>("bridge");
  const [intros, setIntros] = useState<Intro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    const r = await fetchJson<{ intros: Intro[] }>(`/api/intros?role=${tab}`);
    if (r.ok) setIntros(r.data?.intros ?? []);
    else if (r.status === 401) setError("Sign in to see your inbox.");
    else setError(r.error ?? "Couldn't load");
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  async function act(intro: Intro, action: "accept" | "decline") {
    setBusy(intro.id);
    const r = await fetchJson(`/api/intros/${intro.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (r.ok) load();
    else setError(r.error ?? "Action failed");
    setBusy(null);
  }

  return (
    <div>
      <p className="text-sm text-white/40 mb-4">{TABS.find((t) => t.id === tab)?.hint}</p>

      <div className="flex gap-1.5 mb-5 border border-white/8 rounded-full p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 text-[11px] tracking-[0.08em] uppercase rounded-full py-1.5 transition-colors ${
              tab === t.id
                ? "bg-white text-[#0a0a0a] font-semibold"
                : "text-white/55 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-white/30">Loading…</p>
      ) : intros.length === 0 ? (
        <div className="border border-white/8 rounded-2xl p-6 text-center text-sm text-white/40">
          {tab === "bridge"
            ? "Nothing waiting for you to forward."
            : tab === "target"
            ? "No one's been pointed your way — yet."
            : "You haven't asked for any connections yet."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {intros.map((intro) => (
            <IntroRow
              key={intro.id}
              intro={intro}
              tab={tab}
              busy={busy === intro.id}
              onAct={(a) => act(intro, a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IntroRow({
  intro,
  tab,
  busy,
  onAct,
}: {
  intro: Intro;
  tab: Role;
  busy: boolean;
  onAct: (action: "accept" | "decline") => void;
}) {
  const canActBridge = tab === "bridge" && intro.status === "pending";
  const canActTarget = tab === "target" && intro.status === "forwarded";
  const canAct = canActBridge || canActTarget;
  const acceptLabel = canActBridge ? "Forward" : "Accept";

  return (
    <div className="border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <StatusBadge status={intro.status} />
        <span className="text-[10px] text-white/30 tracking-[0.05em]">
          {new Date(intro.created_at).toLocaleDateString()}
        </span>
      </div>

      <div>
        <p className="text-[10px] tracking-[0.12em] uppercase text-white/35 mb-1">
          {tab === "bridge"
            ? "They want to meet"
            : tab === "target"
            ? "They want to meet you about"
            : "You want to meet"}
        </p>
        <p className="text-sm text-white font-medium leading-snug">{intro.goal}</p>
      </div>

      {intro.context && (
        <p className="text-xs text-white/55 leading-relaxed">{intro.context}</p>
      )}

      {intro.draft_message && tab === "bridge" && (
        <div className="bg-white/[0.03] border border-white/8 rounded-xl p-3">
          <p className="text-[9px] tracking-[0.15em] uppercase text-white/35 mb-1">
            Suggested first message
          </p>
          <p className="text-xs text-white/75 leading-relaxed whitespace-pre-wrap">
            {intro.draft_message}
          </p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/connections/${intro.id}`}
          className="text-xs text-white/55 border border-white/10 rounded-full px-3 py-2 hover:text-white hover:border-white/25 transition-colors"
        >
          Open thread
        </Link>
        {canAct && (
          <>
            <button
              onClick={() => onAct("decline")}
              disabled={busy}
              className="text-xs text-white/55 border border-white/10 rounded-full px-3 py-2 hover:text-red-400 hover:border-red-400/40 transition-colors disabled:opacity-40"
            >
              Decline
            </button>
            <button
              onClick={() => onAct("accept")}
              disabled={busy}
              className="ml-auto text-xs font-semibold bg-white text-[#0a0a0a] rounded-full px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {busy ? "…" : acceptLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    suggested: { label: "Suggested", cls: "text-white/50 border-white/15" },
    pending:   { label: "Awaiting you", cls: "text-amber-400 border-amber-400/30" },
    forwarded: { label: "Forwarded", cls: "text-sky-400 border-sky-400/30" },
    connected: { label: "Connected", cls: "text-green-400 border-green-400/30" },
    declined:  { label: "Declined", cls: "text-white/40 border-white/15" },
    expired:   { label: "Expired", cls: "text-white/30 border-white/10" },
  };
  const c = cfg[status] ?? cfg.suggested;
  return (
    <span className={`text-[10px] tracking-[0.12em] uppercase border rounded-full px-2 py-0.5 ${c.cls}`}>
      {c.label}
    </span>
  );
}
