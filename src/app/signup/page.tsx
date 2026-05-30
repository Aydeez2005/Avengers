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
