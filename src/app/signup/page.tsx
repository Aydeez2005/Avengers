"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { id: "ai",        label: "AI" },
  { id: "healthtech",label: "HealthTech" },
  { id: "spacetech", label: "SpaceTech" },
  { id: "climatetech",label: "ClimateTech" },
  { id: "fintech",   label: "FinTech" },
  { id: "biotech",   label: "Biotech" },
  { id: "hardware",  label: "Hardware" },
  { id: "edtech",    label: "EdTech" },
  { id: "web3",      label: "Web3" },
  { id: "other",     label: "Other" },
];

type Role = "builder" | "business";
type Step = "role" | "info" | "idea" | "categories";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);

  // Builder fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [hasIdea, setHasIdea] = useState<boolean | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [otherText, setOtherText] = useState("");

  // Business fields
  const [companyName, setCompanyName] = useState("");

  // Shared
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(id: string) {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleSignup() {
    setLoading(true);
    setError(null);

    const metadata =
      role === "builder"
        ? { full_name: `${firstName.trim()} ${lastName.trim()}`, role: "builder", has_idea: hasIdea,
            categories: categories.map((c) => c === "other" && otherText.trim() ? otherText.trim() : c) }
        : { full_name: companyName.trim(), role: "business", company_name: companyName.trim() };

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) router.push("/discover");
  }

  // ── Step: Role ────────────────────────────────────────────────────────────
  if (step === "role") return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-[390px] flex flex-col">
        <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/90 mb-12">Scout</div>
        <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-2">What player are you?</h1>
        <p className="text-[22px] text-white/25 mb-8">In the BAD1 ecosystem</p>

        <div className="flex flex-col gap-3 mb-8">
          {[
            { id: "builder" as Role, icon: "🛠️", title: "Builder", desc: "Find a co-founder, join projects, and connect at events.", features: ["Co-founder matching", "Browse projects", "Events"] },
            { id: "business" as Role, icon: "🏢", title: "Business", desc: "Post projects, run events, and tap into Berlin's builder network.", features: ["Post projects", "Create events"] },
          ].map((r) => {
            const active = role === r.id;
            return (
              <button key={r.id} onClick={() => setRole(r.id)}
                className={`w-full text-left border rounded-2xl p-4 flex items-start gap-[14px] relative transition-all ${active ? "border-white/60 bg-white/5" : "border-white/10 hover:border-white/25"}`}>
                <div className="w-9 h-9 rounded-[10px] bg-white/7 border border-white/10 flex items-center justify-center text-lg flex-shrink-0 mt-0.5">{r.icon}</div>
                <div className="flex-1 pr-6">
                  <div className="text-[15px] font-semibold text-white mb-1">{r.title}</div>
                  <div className="text-xs text-white/40 leading-relaxed mb-2">{r.desc}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.features.map((f) => (
                      <span key={f} className="text-[10px] text-white/50 border border-white/10 rounded-full px-2 py-0.5">{f}</span>
                    ))}
                  </div>
                </div>
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] transition-all ${active ? "bg-white border-white text-[#0a0a0a]" : "border-white/20 text-transparent"}`}>✓</div>
              </button>
            );
          })}
        </div>

        <button onClick={() => role && setStep("info")} disabled={!role}
          className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity">
          Continue →
        </button>
        <p className="text-center text-sm text-white/35 mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-white/70 hover:text-white transition-colors">Sign in</a>
        </p>
      </div>
    </main>
  );

  // ── Step: Info ────────────────────────────────────────────────────────────
  if (step === "info") return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-[390px] flex flex-col">
        <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/90 mb-12">Scout</div>
        <button onClick={() => setStep("role")} className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 mb-8 text-left">← Back</button>

        <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-8">
          {role === "builder" ? "Tell us about yourself" : "Your business"}
        </h1>

        <div className="flex flex-col gap-3 mb-6">
          {role === "builder" ? (
            <>
              <div className="flex gap-3">
                <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
                <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
              </div>
            </>
          ) : (
            <input type="text" placeholder="Company name" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <div className="h-px bg-white/6 mb-6" />

        {role === "builder" ? (
          <button
            onClick={() => { if (firstName && lastName && email && password) setStep("idea"); }}
            disabled={!firstName || !lastName || !email || !password}
            className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity">
            Continue →
          </button>
        ) : (
          <button onClick={handleSignup} disabled={!companyName || !email || !password || loading}
            className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity">
            {loading ? "Creating account…" : "Create account →"}
          </button>
        )}
      </div>
    </main>
  );

  // ── Step: Idea ────────────────────────────────────────────────────────────
  if (step === "idea") return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-[390px] flex flex-col">
        <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/90 mb-12">Scout</div>
        <button onClick={() => setStep("info")} className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 mb-8 text-left">← Back</button>

        <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-3">Do you have an idea?</h1>
        <p className="text-[15px] text-white/40 mb-8">This helps us match you with the right people.</p>

        <div className="flex flex-col gap-3 mb-8">
          {[
            { val: true,  icon: "💡", title: "Yes, I have an idea", desc: "You're working on something and need the right co-founder." },
            { val: false, icon: "🔍", title: "No, I'm looking for one", desc: "You have the skills and drive — find a project worth building." },
          ].map((opt) => {
            const active = hasIdea === opt.val;
            return (
              <button key={String(opt.val)} onClick={() => setHasIdea(opt.val)}
                className={`w-full text-left border rounded-2xl p-4 flex items-start gap-4 relative transition-all ${active ? "border-white/60 bg-white/5" : "border-white/10 hover:border-white/25"}`}>
                <div className="w-9 h-9 rounded-[10px] bg-white/7 border border-white/10 flex items-center justify-center text-lg flex-shrink-0">{opt.icon}</div>
                <div className="flex-1 pr-6">
                  <div className="text-[15px] font-semibold text-white mb-0.5">{opt.title}</div>
                  <div className="text-xs text-white/40 leading-relaxed">{opt.desc}</div>
                </div>
                <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center text-[11px] transition-all ${active ? "bg-white border-white text-[#0a0a0a]" : "border-white/20 text-transparent"}`}>✓</div>
              </button>
            );
          })}
        </div>

        <button onClick={() => hasIdea !== null && setStep("categories")} disabled={hasIdea === null}
          className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity">
          Continue →
        </button>
      </div>
    </main>
  );

  // ── Step: Categories ──────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-[390px] flex flex-col">
        <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/90 mb-12">Scout</div>
        <button onClick={() => setStep("idea")} className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 mb-8 text-left">← Back</button>

        <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-2">
          {hasIdea ? "What's your idea about?" : "What are you interested in?"}
        </h1>
        <p className="text-[15px] text-white/40 mb-8">Select all that apply.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((cat) => {
            const active = categories.includes(cat.id);
            return (
              <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                className={`text-sm px-4 py-2 rounded-full border transition-colors ${active ? "border-white/60 bg-white/10 text-white" : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/80"}`}>
                {cat.label}
              </button>
            );
          })}
        </div>

        {categories.includes("other") && (
          <input
            type="text"
            placeholder="Describe your field…"
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            autoFocus
            className="w-full bg-white/5 border border-white/30 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors mb-4"
          />
        )}

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        <div className="h-px bg-white/6 mb-6" />

        <button onClick={handleSignup}
          disabled={categories.length === 0 || (categories.includes("other") && !otherText.trim()) || loading}
          className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity">
          {loading ? "Creating account…" : "Enter Scout →"}
        </button>
      </div>
    </main>
  );
}
