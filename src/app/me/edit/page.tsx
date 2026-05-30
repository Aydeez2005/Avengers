"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";

type Profile = {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  current_company: string | null;
  current_title: string | null;
  interests: string[] | null;
  can_intro_to: string[] | null;
  calendly_url: string | null;
  linkedin_url: string | null;
};

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : Promise.reject(r.statusText))
      .then((j) => setProfile(j.profile))
      .catch(() => setError("Couldn't load your profile — are you logged in?"));
  }, []);

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <div className="max-w-[460px] mx-auto w-full flex flex-col pb-24 min-h-screen sm:border-x sm:border-white/6 px-6 pt-10">
          <p className="text-sm text-white/40">
            {error ?? "Loading your profile…"}
          </p>
          <BottomNav />
        </div>
      </main>
    );
  }

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => (p ? { ...p, [key]: value } : p));
  }

  async function save() {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          headline: profile.headline,
          bio: profile.bio,
          location: profile.location,
          current_company: profile.current_company,
          current_title: profile.current_title,
          interests: profile.interests ?? [],
          can_intro_to: profile.can_intro_to ?? [],
          calendly_url: profile.calendly_url,
          linkedin_url: profile.linkedin_url,
        }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "Save failed");
      else {
        setSaved(true);
        setTimeout(() => router.push("/discover"), 700);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[460px] mx-auto w-full flex flex-col pb-28 min-h-screen sm:border-x sm:border-white/6">
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

        <div className="px-6">
          <h1 className="text-2xl font-bold tracking-tight mb-1">Your profile</h1>
          <p className="text-sm text-white/40 mb-7 leading-relaxed">
            The richer this is, the better intros Scout can find for you.
          </p>

          <div className="flex flex-col gap-6">
            <Field label="Name">
              <Input
                value={profile.full_name ?? ""}
                onChange={(v) => set("full_name", v)}
                placeholder="e.g. Umut Akarsu"
              />
            </Field>

            <Field
              label="Headline"
              hint="One line. What you're doing right now."
            >
              <Input
                value={profile.headline ?? ""}
                onChange={(v) => set("headline", v)}
                placeholder="Founder building neurotech in Berlin"
              />
            </Field>

            <Field label="Location">
              <Input
                value={profile.location ?? ""}
                onChange={(v) => set("location", v)}
                placeholder="Berlin"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Title">
                <Input
                  value={profile.current_title ?? ""}
                  onChange={(v) => set("current_title", v)}
                  placeholder="Co-founder"
                />
              </Field>
              <Field label="Company">
                <Input
                  value={profile.current_company ?? ""}
                  onChange={(v) => set("current_company", v)}
                  placeholder="Noverve"
                />
              </Field>
            </div>

            <Field
              label="Bio"
              hint="The story behind your current work — Claude reads this to match you."
            >
              <textarea
                value={profile.bio ?? ""}
                onChange={(e) => set("bio", e.target.value)}
                rows={5}
                placeholder="Lawyer-turned-founder. Six years at a magic-circle firm before quitting to build…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors resize-none"
              />
            </Field>

            <Field
              label="Interested in"
              hint="Topics, industries, technologies. Press Enter to add."
            >
              <ChipInput
                values={profile.interests ?? []}
                onChange={(v) => set("interests", v)}
                placeholder="neurotech, BCI, fintech…"
              />
            </Field>

            <Field
              label="Can intro you to"
              hint="Who you're well-positioned to connect others to. Powers reverse-matching."
            >
              <ChipInput
                values={profile.can_intro_to ?? []}
                onChange={(v) => set("can_intro_to", v)}
                placeholder="Berlin hardware angels, neurotech founders…"
              />
            </Field>

            <Field
              label="Calendly link"
              hint="A 15-min intro link works best."
            >
              <Input
                value={profile.calendly_url ?? ""}
                onChange={(v) => set("calendly_url", v)}
                placeholder="https://calendly.com/you/15min"
              />
            </Field>

            <Field label="LinkedIn">
              <Input
                value={profile.linkedin_url ?? ""}
                onChange={(v) => set("linkedin_url", v)}
                placeholder="https://linkedin.com/in/you"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-red-400 mt-4">{error}</p>}
          {saved && <p className="text-sm text-green-400 mt-4">✓ Saved</p>}

          <button
            onClick={save}
            disabled={saving}
            className="w-full mt-7 bg-white text-[#0a0a0a] rounded-full py-[14px] text-sm font-semibold tracking-[0.05em] disabled:opacity-30 hover:opacity-90 transition-opacity"
          >
            {saving ? "Saving…" : "Save profile"}
          </button>
        </div>

        <BottomNav />
      </div>
    </main>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] tracking-[0.15em] uppercase text-white/40 mb-2 block">
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors"
    />
  );
}

function ChipInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (!t) return;
    if (!values.includes(t)) onChange([...values, t]);
    setDraft("");
  }

  return (
    <div className="border border-white/10 rounded-xl bg-white/5 px-3 py-2 focus-within:border-white/40 transition-colors">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="text-xs text-white/85 bg-white/10 border border-white/15 rounded-full pl-2.5 pr-1 py-0.5 flex items-center gap-1"
          >
            {v}
            <button
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-white/40 hover:text-white text-base leading-none px-1"
              aria-label={`Remove ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit();
            } else if (e.key === "Backspace" && !draft && values.length) {
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={commit}
          placeholder={values.length === 0 ? placeholder : undefined}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none py-1"
        />
      </div>
    </div>
  );
}
