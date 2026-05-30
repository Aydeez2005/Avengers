import BottomNav from "@/components/BottomNav";
import Link from "next/link";

// Hardcoded demo profile — replace with a Supabase fetch once the DB is seeded.
// The id param is accepted but unused so /profile/anything renders the design.
const DEMO = {
  fullName: "Kelly Park",
  initials: "KP",
  headline: "Building consumer BCI — founder @ Noverve",
  location: "Berlin · open to remote",
  roles: ["Startup", "Co-founder"],
  currentTitle: "CEO & Co-founder",
  currentCompany: "Noverve",
  bio:
    "Ex-neuroscience PhD at TU Berlin. Spent four years at Paradromics before starting Noverve in 2024. We're building a non-invasive BCI for focus and sleep — currently in beta with 200 testers.",
  interests: [
    "Neurotech",
    "BCI",
    "Consumer hardware",
    "Deep tech",
    "Sleep science",
    "Founder mode",
  ],
  experience: [
    { org: "Noverve", role: "Founder & CEO", years: "2024 – now" },
    { org: "Paradromics", role: "Senior Research Scientist", years: "2020 – 2024" },
    { org: "TU Berlin", role: "PhD, Computational Neuroscience", years: "2016 – 2020" },
  ],
  lookingFor: [
    "Seed investors (deeptech, hardware-friendly)",
    "Senior hardware engineer (analog / signal processing)",
    "Sleep researchers for our advisory board",
  ],
  canIntroTo: [
    "Neurotech founders across Europe",
    "Berlin hardware angels",
    "BCI / EEG academic labs",
  ],
  paths: [
    {
      bridge: "Alex Tan",
      reason: "Worked with Kelly at Paradromics. Strong tie.",
      strength: 0.82,
    },
    {
      bridge: "Lena Müller",
      reason: "Classmate at TU Berlin neuroscience cohort.",
      strength: 0.61,
    },
  ],
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params; // touch the param so the route is dynamic
  const p = DEMO;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-[460px] mx-auto w-full flex flex-col pb-28 min-h-screen sm:border-x sm:border-white/6">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <Link
          href="/discover"
          className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/70 transition-colors"
        >
          ← Back
        </Link>
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">
          Scout
        </span>
        <button className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/70 transition-colors">
          Share
        </button>
      </div>

      <div className="px-6 pt-2">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/10 flex items-center justify-center text-2xl font-bold mb-4">
            {p.initials}
          </div>
          <h1 className="text-[26px] font-bold tracking-tight leading-tight">
            {p.fullName}
          </h1>
          <p className="text-sm text-white/55 mt-1.5 leading-relaxed max-w-[300px]">
            {p.headline}
          </p>
          <p className="text-[11px] tracking-[0.1em] uppercase text-white/30 mt-3">
            {p.location}
          </p>

          {/* Role chips */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {p.roles.map((r) => (
              <span
                key={r}
                className="text-[10px] tracking-[0.1em] uppercase text-white/55 border border-white/15 rounded-full px-2.5 py-1"
              >
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Paths — Scout's defining section. Shown first if there are any. */}
        {p.paths.length > 0 && (
          <Section title="How you can reach them" accent>
            <div className="flex flex-col gap-2">
              {p.paths.map((path) => (
                <div
                  key={path.bridge}
                  className="border border-white/10 bg-white/[0.02] rounded-xl p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {path.bridge
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">
                      via {path.bridge}
                    </div>
                    <div className="text-[11px] text-white/45 leading-snug truncate">
                      {path.reason}
                    </div>
                  </div>
                  <div className="text-[10px] tracking-[0.1em] uppercase text-white/40 flex-shrink-0">
                    {Math.round(path.strength * 100)}%
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 bg-white text-[#0a0a0a] rounded-full py-3 text-sm font-semibold tracking-[0.05em] hover:opacity-90 transition-opacity">
              Ask for an intro →
            </button>
          </Section>
        )}

        {/* Bio */}
        <Section title="About">
          <p className="text-sm text-white/65 leading-relaxed">{p.bio}</p>
        </Section>

        {/* Currently */}
        <Section title="Currently">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-base flex-shrink-0">
              🚀
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {p.currentTitle}
              </div>
              <div className="text-xs text-white/45">{p.currentCompany}</div>
            </div>
          </div>
        </Section>

        {/* Interests — these drive matching */}
        <Section title="Interested in">
          <div className="flex flex-wrap gap-1.5">
            {p.interests.map((i) => (
              <span
                key={i}
                className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-full px-2.5 py-1"
              >
                {i}
              </span>
            ))}
          </div>
        </Section>

        {/* Looking for */}
        <Section title="Looking for">
          <ul className="flex flex-col gap-2">
            {p.lookingFor.map((item) => (
              <li
                key={item}
                className="text-sm text-white/70 leading-relaxed flex items-start gap-2"
              >
                <span className="text-white/30 mt-1">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Can intro to — Scout-specific. Powers reverse matching. */}
        <Section title="Can intro you to">
          <div className="flex flex-wrap gap-1.5">
            {p.canIntroTo.map((i) => (
              <span
                key={i}
                className="text-xs text-white/60 border border-dashed border-white/15 rounded-full px-2.5 py-1"
              >
                {i}
              </span>
            ))}
          </div>
        </Section>

        {/* Experience */}
        <Section title="Experience">
          <div className="flex flex-col gap-3">
            {p.experience.map((e) => (
              <div
                key={e.org + e.years}
                className="flex items-start gap-3 border-l border-white/10 pl-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{e.role}</div>
                  <div className="text-xs text-white/45">
                    {e.org} · {e.years}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <BottomNav />
      </div>
    </main>
  );
}

function Section({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`mb-6 ${
        accent
          ? "border border-white/15 bg-white/[0.03] rounded-2xl p-4"
          : ""
      }`}
    >
      <h2 className="text-[10px] tracking-[0.15em] uppercase text-white/35 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
