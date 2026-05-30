"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/discover");
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-start py-10 px-4">
      <div className="w-full max-w-[390px] flex flex-col">
        <div className="flex items-center justify-between mb-12">
          <div className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</div>
          <a href="/signup" className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 transition-colors">← Back</a>
        </div>

        <h1 className="text-[32px] font-bold tracking-tight leading-[1.15] mb-3">
          Welcome<br />back
        </h1>
        <p className="text-[15px] text-white/45 leading-relaxed mb-8">
          Sign in to continue finding your people in Berlin.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
          />
        </div>

        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

        <div className="h-px bg-white/6 mb-6" />

        <button
          onClick={handleLogin}
          disabled={!email || !password || loading}
          className="w-full bg-white text-[#0a0a0a] rounded-full py-[15px] text-sm font-semibold tracking-[0.05em] transition-opacity disabled:opacity-30 hover:opacity-90"
        >
          {loading ? "Signing in…" : "Sign in →"}
        </button>

        <p className="text-center text-sm text-white/35 mt-4">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-white/70 hover:text-white transition-colors">
            Sign up
          </a>
        </p>
      </div>
    </main>
  );
}
