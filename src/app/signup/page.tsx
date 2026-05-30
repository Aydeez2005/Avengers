"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ROLES = [
  {
    id: "cofounder",
    icon: "🤝",
    title: "Co-founder",
    desc: "You're building something and looking for the right person to build it with.",
    features: ["Swipe to match", "Skill matching", "Idea alignment"],
  },
  {
    id: "student",
    icon: "🎓",
    title: "Student",
    desc: "Join projects, find a co-founder, or land your first startup job.",
    features: ["Co-founder matching", "Project search", "Job search"],
  },
  {
    id: "startup",
    icon: "🚀",
    title: "Startup",
    desc: "Find a co-founder, post open projects, or hire your first team.",
    features: ["Co-founder matching", "Post a project", "Post jobs"],
  },
  {
    id: "researcher",
    icon: "🔬",
    title: "Researcher",
    desc: "Connect your research to the startups that can bring it to market.",
    features: ["Business matching", "Project collaboration"],
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"roles" | "account">("roles");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSignup() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { roles: Array.from(selected) },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      router.push("/discover");
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start py-10 px-4">
      {/* Phone frame */}
      <div className="w-full max-w-[390px] flex flex-col gap-0">

        {/* Wordmark */}
        <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/90 mb-12 px-1">
          Scout
        </div>

        {step === "roles" ? (
          <>
            <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-3">
              Who are you<br />building with?
            </h1>
            <p className="text-[15px] text-white/45 leading-relaxed mb-2">
              Find your co-founder, team, or next project — right here in Berlin.
            </p>
            <p className="text-[11px] tracking-[0.12em] uppercase text-white/25 mb-7">
              Select all that apply
            </p>

            <div className="flex flex-col gap-[10px] mb-8">
              {ROLES.map((role) => {
                const isSelected = selected.has(role.id);
                return (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={`w-full text-left border rounded-2xl p-4 flex items-start gap-[14px] relative transition-all duration-150 ${
                      isSelected
                        ? "border-white/60 bg-white/5"
                        : "border-white/10 hover:border-white/25 hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-[10px] bg-white/7 border border-white/10 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">
                      {role.icon}
                    </div>

                    {/* Info */}
                    <div className="flex-1 pr-7">
                      <div className="text-[15px] font-semibold text-white mb-1">
                        {role.title}
                      </div>
                      <div className="text-xs text-white/40 leading-relaxed">
                        {role.desc}
                      </div>
                      <div className="flex flex-wrap gap-[5px] mt-[10px]">
                        {role.features.map((f) => (
                          <span
                            key={f}
                            className="text-[10px] tracking-[0.08em] text-white/50 border border-white/10 rounded-full px-2 py-0.5"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      className={`absolute top-[14px] right-4 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] transition-all duration-150 ${
                        isSelected
                          ? "bg-white border-white text-[#0a0a0a]"
                          : "border-white/20 text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="h-px bg-white/6 mb-6" />

            <button
              onClick={() => setStep("account")}
              disabled={selected.size === 0}
              className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] transition-opacity disabled:opacity-30 hover:opacity-90"
            >
              Continue →
            </button>

            <p className="text-center text-sm text-white/35 mt-4">
              Already have an account?{" "}
              <a href="/login" className="text-white/70 hover:text-white transition-colors">
                Sign in
              </a>
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep("roles")}
              className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 transition-colors mb-10 text-left"
            >
              ← Back
            </button>

            <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-3">
              Create your<br />account
            </h1>
            <p className="text-[15px] text-white/45 leading-relaxed mb-8">
              You&apos;re joining as:{" "}
              <span className="text-white/70">
                {Array.from(selected)
                  .map((id) => ROLES.find((r) => r.id === id)?.title)
                  .join(", ")}
              </span>
            </p>

            <div className="flex flex-col gap-3 mb-8">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 mb-4">{error}</p>
            )}

            <div className="h-px bg-white/6 mb-6" />

            <button
              onClick={handleSignup}
              disabled={!email || !password || loading}
              className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] transition-opacity disabled:opacity-30 hover:opacity-90"
            >
              {loading ? "Creating account…" : "Create account →"}
            </button>

            <p className="text-center text-sm text-white/35 mt-4">
              Already have an account?{" "}
              <a href="/login" className="text-white/70 hover:text-white transition-colors">
                Sign in
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
