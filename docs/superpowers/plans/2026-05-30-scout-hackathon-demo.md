# Scout Hackathon Demo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a polished, demoable Scout MVP at bad1.events — co-founder/startup/student/researcher matching for Berlin, accessible via a live Vercel URL on any phone.

**Architecture:** Pure Next.js 14 App Router frontend, no SSR needed (all screens are client-side). Matches are persisted in `localStorage` so they survive page refresh during the demo. No backend calls during the demo — all data is mock.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, localStorage for match state.

---

## File Map

| File | Change |
|------|--------|
| `src/app/discover/page.tsx` | Wire swipe → localStorage matches |
| `src/app/matches/page.tsx` | Read matches from localStorage, live list |
| `src/app/signup/page.tsx` | Remove Supabase calls, redirect to discover |
| `src/lib/matches.ts` | Create — tiny localStorage helpers |
| Vercel dashboard | Add `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars |

---

## Task 1: Fix Vercel Deployment (env vars)

**Files:** Vercel project settings (browser, not code)

- [ ] **Step 1: Open Vercel project settings**

  Go to: https://vercel.com/aydeez2005s-projects/scout-berlin/settings/environment-variables

- [ ] **Step 2: Add both env vars**

  Add these two variables (values from your `.env.local`):
  ```
  NEXT_PUBLIC_SUPABASE_URL = https://nmwjxktwithmnzhyyboo.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGci...  (your full anon key)
  ```
  Set scope: **Production + Preview + Development**

- [ ] **Step 3: Redeploy**

  ```bash
  cd /Users/alice/Desktop/develop/Hackathon/BAD1 && vercel --prod
  ```
  Expected: Build succeeds, live URL printed.

---

## Task 2: Match Persistence via localStorage

**Files:**
- Create: `src/lib/matches.ts`
- Modify: `src/app/discover/page.tsx`
- Modify: `src/app/matches/page.tsx`

- [ ] **Step 1: Create localStorage helpers**

  Create `src/lib/matches.ts`:
  ```typescript
  import { CardData } from "@/components/SwipeCard";

  const KEY = "scout_matches";

  export function getMatches(): CardData[] {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  export function addMatch(card: CardData): void {
    const existing = getMatches();
    if (existing.find((m) => m.id === card.id)) return;
    localStorage.setItem(KEY, JSON.stringify([card, ...existing]));
  }

  export function clearMatches(): void {
    localStorage.removeItem(KEY);
  }
  ```

- [ ] **Step 2: Wire connect action in discover page**

  In `src/app/discover/page.tsx`, add the import at the top:
  ```typescript
  import { addMatch } from "@/lib/matches";
  ```

  Update `handleConnect`:
  ```typescript
  function handleConnect() {
    setLastAction("connect");
    addMatch(cards[0]);
    setMatchCounts((prev) => ({ ...prev, [mode]: prev[mode] + 1 }));
    setCardStacks((prev) => ({ ...prev, [mode]: prev[mode].slice(1) }));
    setTimeout(() => setLastAction(null), 800);
  }
  ```

- [ ] **Step 3: Read matches from localStorage in matches page**

  Replace `src/app/matches/page.tsx` entirely:
  ```typescript
  "use client";

  import { useEffect, useState } from "react";
  import BottomNav from "@/components/BottomNav";
  import { CardData } from "@/components/SwipeCard";
  import { getMatches } from "@/lib/matches";

  const TYPE_EMOJI: Record<string, string> = {
    Startup: "🚀",
    "Co-founder": "🤝",
    Researcher: "🔬",
    Student: "🎓",
  };

  export default function MatchesPage() {
    const [matches, setMatches] = useState<CardData[]>([]);

    useEffect(() => {
      setMatches(getMatches());
    }, []);

    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
        <div className="px-6 pt-5 pb-4">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
        </div>

        <div className="px-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Matches</h1>
          <p className="text-sm text-white/40 mb-6">People who connected back with you</p>

          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
              <div className="text-4xl">💬</div>
              <p className="text-sm text-white/40">No matches yet — start swiping!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-4 border border-white/10 rounded-2xl p-4 hover:border-white/25 transition-colors cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                    {TYPE_EMOJI[m.type] ?? "✨"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-white truncate">{m.name}</span>
                      <span className="text-[10px] text-white/30 flex-shrink-0 border border-white/15 rounded-full px-2 py-0.5 uppercase tracking-wider">
                        {m.type}
                      </span>
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
  ```

- [ ] **Step 4: Commit**

  ```bash
  cd /Users/alice/Desktop/develop/Hackathon/BAD1
  git add src/lib/matches.ts src/app/discover/page.tsx src/app/matches/page.tsx
  git commit -m "feat: persist matches to localStorage, live matches list"
  ```

---

## Task 3: Fix Signup — Skip Auth, Go Straight to Discover

The current signup page calls Supabase. For the demo, skip auth entirely — role selection + "Enter" lands on discover.

**Files:**
- Modify: `src/app/signup/page.tsx`

- [ ] **Step 1: Replace signup with a local-only flow**

  Replace `src/app/signup/page.tsx` entirely:
  ```typescript
  "use client";

  import { useState } from "react";
  import { useRouter } from "next/navigation";

  const ROLES = [
    { id: "cofounder", label: "Co-founder", emoji: "🤝" },
    { id: "student",   label: "Student",    emoji: "🎓" },
    { id: "startup",   label: "Startup",    emoji: "🚀" },
    { id: "researcher",label: "Researcher", emoji: "🔬" },
  ];

  export default function SignupPage() {
    const router = useRouter();
    const [selected, setSelected] = useState<string[]>([]);
    const [step, setStep] = useState<1 | 2>(1);
    const [name, setName] = useState("");

    function toggleRole(id: string) {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
      );
    }

    function handleContinue() {
      if (step === 1 && selected.length > 0) setStep(2);
    }

    function handleEnter() {
      if (!name.trim()) return;
      if (typeof window !== "undefined") {
        localStorage.setItem("scout_name", name.trim());
        localStorage.setItem("scout_roles", JSON.stringify(selected));
      }
      router.push("/discover");
    }

    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col px-6 pt-16 pb-10">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90 mb-12">
          Scout
        </span>

        {step === 1 ? (
          <>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Who are you?</h1>
            <p className="text-sm text-white/40 mb-8">Select all that apply.</p>

            <div className="flex flex-col gap-3 mb-10">
              {ROLES.map((role) => {
                const active = selected.includes(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border text-left transition-colors ${
                      active
                        ? "border-white/60 bg-white/10 text-white"
                        : "border-white/12 bg-white/[0.02] text-white/60 hover:border-white/30 hover:text-white/80"
                    }`}
                  >
                    <span className="text-2xl">{role.emoji}</span>
                    <span className="font-semibold text-base tracking-tight">{role.label}</span>
                    {active && <span className="ml-auto text-white/60 text-sm">✓</span>}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleContinue}
              disabled={selected.length === 0}
              className="w-full py-4 rounded-2xl bg-white text-[#0a0a0a] font-bold text-sm tracking-wide disabled:opacity-30 transition-opacity"
            >
              Continue →
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight mb-2">What&apos;s your name?</h1>
            <p className="text-sm text-white/40 mb-8">This is how you&apos;ll appear to others.</p>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleEnter()}
              placeholder="Your name or company"
              autoFocus
              className="w-full bg-white/[0.04] border border-white/15 rounded-2xl px-5 py-4 text-white placeholder-white/25 text-base outline-none focus:border-white/40 transition-colors mb-4"
            />

            <button
              onClick={handleEnter}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl bg-white text-[#0a0a0a] font-bold text-sm tracking-wide disabled:opacity-30 transition-opacity"
            >
              Enter Scout →
            </button>

            <button
              onClick={() => setStep(1)}
              className="mt-4 text-center text-xs text-white/30 hover:text-white/60 transition-colors w-full"
            >
              ← Back
            </button>
          </>
        )}
      </main>
    );
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/app/signup/page.tsx
  git commit -m "feat: skip auth on signup, store name+roles in localStorage"
  ```

---

## Task 4: Show User's Name in Discover Top Bar

Read the stored name from localStorage and show it instead of hardcoded "A".

**Files:**
- Modify: `src/app/discover/page.tsx`

- [ ] **Step 1: Read name from localStorage and display initial**

  Add at the top of `DiscoverPage` component (inside the function, before the return):
  ```typescript
  const [userName, setUserName] = useState("A");
  useEffect(() => {
    const n = localStorage.getItem("scout_name");
    if (n) setUserName(n[0].toUpperCase());
  }, []);
  ```

  Add `useEffect` to the imports at the top of the file:
  ```typescript
  import { useState, useEffect } from "react";
  ```

  In the JSX, replace the hardcoded `"A"` in the avatar div:
  ```tsx
  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm">
    {userName}
  </div>
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/app/discover/page.tsx
  git commit -m "feat: show user initial from localStorage in top bar"
  ```

---

## Task 5: Deploy to Production

- [ ] **Step 1: Push all commits**

  ```bash
  cd /Users/alice/Desktop/develop/Hackathon/BAD1
  git push
  ```

- [ ] **Step 2: Deploy to Vercel production**

  ```bash
  vercel --prod
  ```
  Expected output ends with: `✓ Production: https://scout-berlin.vercel.app`

- [ ] **Step 3: Test on phone**

  Open the production URL on your phone. Walk through:
  1. `/signup` → pick roles → enter name → lands on `/discover`
  2. Swipe right (connect) on 2–3 cards
  3. Tap Matches tab → see connected cards listed
  4. Tap Profile tab → settings screen

---

## Demo Script (for judges)

> "Scout is Tinder for the Berlin startup ecosystem. Students find projects, founders find co-founders, researchers find industry partners — all in one app. You pick your role, and we show you relevant matches. Swipe right to connect, left to pass. Real connections go straight to your Matches tab."

Show in this order: signup → discover (swipe a few) → matches tab.
