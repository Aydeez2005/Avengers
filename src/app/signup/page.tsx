"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const ROLES = [
  {
    id: "founder",
    icon: "🧭",
    title: "Founder",
    desc: "You have a vision and need the right co-founder to build it with.",
    features: ["Co-founder matching", "Events"],
  },
  {
    id: "builder",
    icon: "🛠️",
    title: "Builder",
    desc: "You have skills and drive — find a co-founder, join a project, or land a role.",
    features: ["Co-founder matching", "Join projects", "Events"],
  },
  {
    id: "researcher",
    icon: "🔬",
    title: "Researcher",
    desc: "Turn your research into a venture. Find a business co-founder and the right events.",
    features: ["Co-founder matching", "Events"],
  },
  {
    id: "startup",
    icon: "🚀",
    title: "Startup",
    desc: "Post projects, hire talent, and find participants for your events.",
    features: ["Post projects", "Find talent", "Event recruiting"],
  },
  {
    id: "corporate",
    icon: "🏢",
    title: "Corporate",
    desc: "Source innovation, post projects, and connect with the startup ecosystem.",
    features: ["Post projects", "Find talent", "Event recruiting"],
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"roles" | "account">("roles");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleRole(id: string) {
    setSelected((prev) => (prev === id ? null : id));
  }

  async function handleLinkedIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "linkedin_oidc",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "openid profile email",
        queryParams: {
          roles: selected ?? "",
        },
      },
    });
    if (error) setError(error.message);
  }

  async function handleSignup() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name.trim(), role: selected },
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
            <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-1">
              What player are you?
            </h1>
            <p className="text-[22px] text-white/25 leading-relaxed mb-2">
              In the BAD1 ecosystem
            </p>
            <p className="text-[11px] tracking-[0.12em] uppercase text-white/25 mb-7">
              Select all that apply
            </p>

            <div className="flex flex-col gap-[10px] mb-8">
              {ROLES.map((role) => {
                const isSelected = selected === role.id;
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
              disabled={selected === null}
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
                {ROLES.find((r) => r.id === selected)?.title}
              </span>
            </p>

            {/* LinkedIn */}
            <button
              onClick={handleLinkedIn}
              className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] hover:bg-[#0958a8] text-white rounded-full py-[14px] text-sm font-semibold tracking-[0.03em] transition-colors mb-4"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Continue with LinkedIn
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-xs text-white/25 tracking-[0.1em] uppercase">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            <div className="flex flex-col gap-3 mb-8">
              <input
                type="text"
                placeholder="Your name or company"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
              />
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
              disabled={!name.trim() || !email || !password || loading}
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
