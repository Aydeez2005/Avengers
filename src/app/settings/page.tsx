"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/lib/supabase";

const CATEGORY_OPTIONS = [
  "AI", "HealthTech", "SpaceTech", "ClimateTech", "FinTech",
  "Biotech", "Hardware", "EdTech", "Web3", "Sustainability", "Other",
];

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Editable profile fields
  const [tagline, setTagline] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      setName(meta.full_name ?? data.user?.email ?? "");
      setRole(meta.role ?? "");
    });
    fetch("/api/profiles/me").then((r) => r.json()).then((p) => {
      if (!p) return;
      if (p.avatar_url) setAvatarUrl(p.avatar_url);
      if (p.tagline) setTagline(p.tagline);
      if (p.bio) setBio(p.bio);
      if (p.education) setEducation(p.education);
      if (p.looking_for) setLookingFor(p.looking_for);
      if (p.location) setLocation(p.location);
      if (p.linkedin_url) setLinkedinUrl(p.linkedin_url);
      if (Array.isArray(p.categories)) setCategories(p.categories);
    });
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); return; }

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) { console.error(uploadError); setUploading(false); return; }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatar_url: publicUrl }),
    });

    setAvatarUrl(publicUrl + "?t=" + Date.now());
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline,
          bio,
          education,
          looking_for: lookingFor,
          location,
          linkedin_url: linkedinUrl,
          categories,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSaveError(json?.error ?? "Save failed");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setSaveError("Network error — try again");
    }
    setSaving(false);
  }

  function toggleCategory(cat: string) {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const roleLabel: Record<string, string> = { builder: "Builder", business: "Business" };

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-28">
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <button onClick={() => router.back()} className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 transition-colors">← Back</button>
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
        <div className="w-12" />
      </div>

      <div className="px-6 flex flex-col gap-8">
        {/* Avatar + name header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/15 flex-shrink-0 group"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/8 flex items-center justify-center text-2xl font-bold text-white/40">
                {name[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
              {uploading
                ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                : <span className="text-white text-xs">📷</span>
              }
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

          <div>
            <h2 className="text-lg font-bold tracking-tight">{name || "—"}</h2>
            {role && (
              <span className="inline-block text-[10px] tracking-[0.1em] uppercase text-white/50 border border-white/15 rounded-full px-2 py-0.5 mt-1.5">
                {roleLabel[role] ?? role}
              </span>
            )}
            <p className="text-xs text-white/30 mt-1">Tap photo to update</p>
          </div>
        </div>

        {/* ── Edit Profile ─────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3 px-1">Edit Profile</p>
          <div className="flex flex-col gap-3">

            <Field label="Tagline" hint="Shown on your swipe card">
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Building AI tools for legal teams"
                className={inputCls}
              />
            </Field>

            <Field label="Bio" hint="More about you">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people who you are, what you've done, what drives you…"
                rows={3}
                className={inputCls + " resize-none"}
              />
            </Field>

            <Field label="Education">
              <input
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g. CS @ TU Berlin"
                className={inputCls}
              />
            </Field>

            <Field label="Looking for" hint="Shown on your swipe card">
              <input
                type="text"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder="e.g. Technical co-founder with ML background"
                className={inputCls}
              />
            </Field>

            <Field label="Location">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Berlin"
                className={inputCls}
              />
            </Field>

            <Field label="LinkedIn URL" hint="optional">
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/yourhandle"
                className={inputCls}
              />
            </Field>

            <Field label="Categories" hint="Shown as tags on your card">
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${
                      categories.includes(cat)
                        ? "border-white/60 bg-white/10 text-white"
                        : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </Field>

          </div>

          {saveError && (
            <p className="text-sm text-red-400 mt-4 px-1">{saveError}</p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 py-3.5 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            {saved ? "✓ Saved" : saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {/* ── Account ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2 px-1">Account</p>
          <div className="border border-white/8 rounded-2xl overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/[0.03] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[13px] text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-white/35 transition-colors";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2 px-1">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/40">{label}</span>
        {hint && <span className="text-[10px] text-white/20">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
