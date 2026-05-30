"use client";

import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import SwipeCard, { CardData } from "@/components/SwipeCard";
import { supabase } from "@/lib/supabase";
import { addMatch } from "@/lib/matches";

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",        label: "All" },
  { id: "ai",         label: "AI" },
  { id: "healthtech", label: "HealthTech" },
  { id: "spacetech",  label: "SpaceTech" },
  { id: "climatetech",label: "ClimateTech" },
  { id: "fintech",    label: "FinTech" },
  { id: "biotech",    label: "Biotech" },
  { id: "hardware",   label: "Hardware" },
  { id: "edtech",     label: "EdTech" },
];

// ── Mock data ──────────────────────────────────────────────────────────────

type CofounderCard = CardData & { hasIdea: boolean; categories: string[] };

const ALL_COFOUNDERS: CofounderCard[] = [
  // Has idea
  { id: 1, type: "Co-founder", hasIdea: true, categories: ["ai"],
    name: "Lena Müller", tagline: "Building an AI-powered legal contract tool. Need a business co-founder.", location: "Berlin",
    tags: ["AI", "LegalTech", "B2B"], lookingFor: "Business co-founder — sales & GTM",
    meta: [{ label: "Skills", value: "ML / Full-stack" }, { label: "Stage", value: "Idea" }, { label: "Equity", value: "50/50" }],
    contact: { email: "lena.mueller@clausify.de", linkedin: "linkedin.com/in/lena-mueller-berlin" } },
  { id: 2, type: "Co-founder", hasIdea: true, categories: ["healthtech"],
    name: "Dr. Yuki Tanaka", tagline: "Ex-Charité doctor building a digital diagnostics tool for rare diseases.", location: "Berlin",
    tags: ["HealthTech", "AI", "B2B"], lookingFor: "CTO / ML Engineer",
    meta: [{ label: "Background", value: "Medicine" }, { label: "Stage", value: "Pre-seed" }, { label: "Equity", value: "Open" }],
    contact: { email: "yuki.tanaka@raredx.io", linkedin: "linkedin.com/in/dr-yuki-tanaka" } },
  { id: 3, type: "Co-founder", hasIdea: true, categories: ["spacetech"],
    name: "Nico Braun", tagline: "Aerospace engineer. Building a real-time satellite imagery platform for logistics.", location: "Berlin",
    tags: ["SpaceTech", "Deep Tech", "B2B"], lookingFor: "Business co-founder — enterprise sales",
    meta: [{ label: "Background", value: "Aerospace" }, { label: "Stage", value: "Idea" }, { label: "Equity", value: "50/50" }],
    contact: { email: "nico.braun@orbitview.space", linkedin: "linkedin.com/in/nico-braun-space" } },
  { id: 4, type: "Co-founder", hasIdea: true, categories: ["climatetech"],
    name: "Sara Kim", tagline: "Ex-Zalando product lead building a carbon footprint tracker for SMEs.", location: "Berlin",
    tags: ["ClimateTech", "SaaS", "B2B"], lookingFor: "Technical co-founder",
    meta: [{ label: "Background", value: "Product" }, { label: "Stage", value: "Idea" }, { label: "Equity", value: "50/50" }],
    contact: { email: "sara.kim@ecotrace.io", linkedin: "linkedin.com/in/sara-kim-product" } },
  { id: 5, type: "Co-founder", hasIdea: true, categories: ["fintech"],
    name: "Erik Svensson", tagline: "Ex-N26 engineer building embedded insurance for gig-economy workers.", location: "Berlin",
    tags: ["FinTech", "Insurance", "B2C"], lookingFor: "Business co-founder — GTM & partnerships",
    meta: [{ label: "Skills", value: "Backend / Infra" }, { label: "Stage", value: "Pre-seed" }, { label: "Equity", value: "Open" }],
    contact: { email: "erik.svensson@gigcover.com", linkedin: "linkedin.com/in/erik-svensson-fintech" } },
  { id: 6, type: "Co-founder", hasIdea: true, categories: ["biotech"],
    name: "Dr. Fatima Al-Hassan", tagline: "Biochemist at FU Berlin spinning out a drug discovery AI from her lab.", location: "Berlin",
    tags: ["Biotech", "AI", "Deep Tech"], lookingFor: "CEO / commercial co-founder",
    meta: [{ label: "Background", value: "Biochemistry" }, { label: "Stage", value: "Pre-seed" }, { label: "Patents", value: "2" }],
    contact: { email: "fatima.alhassan@fu-berlin.de", linkedin: "linkedin.com/in/dr-fatima-al-hassan" } },
  { id: 7, type: "Co-founder", hasIdea: true, categories: ["edtech"],
    name: "Marco Rossi", tagline: "Former teacher turned product manager. Building adaptive learning for K-12.", location: "Berlin",
    tags: ["EdTech", "AI", "B2C"], lookingFor: "Technical co-founder — full-stack + AI",
    meta: [{ label: "Background", value: "Product / Teaching" }, { label: "Stage", value: "Idea" }, { label: "Equity", value: "50/50" }],
    contact: { email: "marco.rossi@learnloop.io", linkedin: "linkedin.com/in/marco-rossi-edtech" } },
  { id: 8, type: "Co-founder", hasIdea: true, categories: ["hardware"],
    name: "Priya Sharma", tagline: "Robotics engineer. Building affordable exoskeleton aids for elderly care.", location: "Berlin",
    tags: ["Hardware", "HealthTech", "Deep Tech"], lookingFor: "Business co-founder",
    meta: [{ label: "Background", value: "Robotics" }, { label: "Stage", value: "Prototype" }, { label: "Equity", value: "Open" }],
    contact: { email: "priya.sharma@exoaid.tech", linkedin: "linkedin.com/in/priya-sharma-robotics" } },
  // No idea
  { id: 9, type: "Co-founder", hasIdea: false, categories: ["ai", "fintech"],
    name: "Max Becker", tagline: "Ex-BCG consultant. Strong in strategy and business development. Ready to go all-in.", location: "Berlin",
    tags: ["Strategy", "FinTech", "AI"], lookingFor: "A founder with a clear problem to solve",
    meta: [{ label: "Skills", value: "Strategy / Ops" }, { label: "Availability", value: "Full-time" }, { label: "Equity", value: "Open" }],
    contact: { email: "max.becker@gmail.com", linkedin: "linkedin.com/in/max-becker-strategy" } },
  { id: 10, type: "Co-founder", hasIdea: false, categories: ["healthtech", "biotech"],
    name: "Aisha Ndiaye", tagline: "ML engineer, PhD TU Berlin. Wants to work on a hard health or biotech problem.", location: "Berlin",
    tags: ["AI", "HealthTech", "Biotech"], lookingFor: "A founder with a health or biotech idea",
    meta: [{ label: "Skills", value: "ML / AI" }, { label: "Availability", value: "Part-time" }, { label: "Equity", value: "Open" }],
    contact: { email: "aisha.ndiaye@tu-berlin.de", linkedin: "linkedin.com/in/aisha-ndiaye-ml" } },
  { id: 11, type: "Co-founder", hasIdea: false, categories: ["climatetech", "hardware"],
    name: "Jonas Weber", tagline: "Hardware engineer, 5 years at Bosch. Passionate about climate and energy transition.", location: "Berlin",
    tags: ["ClimateTech", "Hardware", "Deep Tech"], lookingFor: "Founder with a climate or hardware vision",
    meta: [{ label: "Skills", value: "Hardware / EE" }, { label: "Availability", value: "Full-time" }, { label: "Notice", value: "1 month" }],
    contact: { email: "jonas.weber@protonmail.com", linkedin: "linkedin.com/in/jonas-weber-hardware" } },
  { id: 12, type: "Co-founder", hasIdea: false, categories: ["spacetech", "ai"],
    name: "Elena Petrova", tagline: "Data scientist at DLR. Wants to work on satellite data or AI applications.", location: "Berlin",
    tags: ["SpaceTech", "AI", "Data"], lookingFor: "Founder with a space or AI idea",
    meta: [{ label: "Skills", value: "Data Science" }, { label: "Availability", value: "Part-time" }, { label: "Equity", value: "Open" }],
    contact: { email: "elena.petrova@dlr.de", linkedin: "linkedin.com/in/elena-petrova-dlr" } },
  { id: 13, type: "Co-founder", hasIdea: false, categories: ["fintech", "ai"],
    name: "David Osei", tagline: "Chartered accountant turned software engineer. Interested in fintech or AI automation.", location: "Berlin",
    tags: ["FinTech", "AI", "Accounting"], lookingFor: "Founder with a B2B SaaS idea",
    meta: [{ label: "Skills", value: "Finance / Engineering" }, { label: "Availability", value: "Full-time" }, { label: "Notice", value: "Immediate" }],
    contact: { email: "david.osei@outlook.com", linkedin: "linkedin.com/in/david-osei-fintech" } },
  { id: 14, type: "Co-founder", hasIdea: false, categories: ["edtech", "ai"],
    name: "Hana Nakamura", tagline: "Product designer at Duolingo Berlin. Ready to co-found an AI or EdTech startup.", location: "Berlin",
    tags: ["Design", "EdTech", "AI"], lookingFor: "Technical co-founder with a product vision",
    meta: [{ label: "Skills", value: "Product Design" }, { label: "Availability", value: "Full-time" }, { label: "Equity", value: "Open" }],
    contact: { email: "hana.nakamura@duolingo.com", linkedin: "linkedin.com/in/hana-nakamura-design" } },
];

type EventData = {
  id: number; name: string; organiser: string; type: "Hackathon" | "Workshop" | "Meetup" | "Conference";
  date: string; time: string; location: string; tags: string[]; description: string; spots: number;
};

const EVENTS: EventData[] = [
  { id: 1, name: "BAD1 Hackathon", organiser: "BAD1", type: "Hackathon",
    date: "31 May 2026", time: "09:00", location: "Factory Berlin, Mitte",
    tags: ["AI", "ClimateTech", "FinTech"], description: "48-hour hackathon. Build a product from scratch with a team you meet on the day.",
    spots: 120 },
  { id: 2, name: "Founder AI Workshop", organiser: "Berlin Founders Club", type: "Workshop",
    date: "7 June 2026", time: "10:00", location: "Soho House Berlin",
    tags: ["AI", "Product"], description: "Hands-on workshop on integrating AI into your startup — from prototype to production.",
    spots: 30 },
  { id: 3, name: "SpaceTech Meetup Berlin", organiser: "Berlin Deep Tech", type: "Meetup",
    date: "14 June 2026", time: "19:00", location: "TU Berlin, Main Building",
    tags: ["SpaceTech", "Deep Tech", "Hardware"], description: "Founders, researchers, and engineers connecting around space and hard tech.",
    spots: 80 },
  { id: 4, name: "HealthTech Demo Day", organiser: "Charité Innovation Hub", type: "Conference",
    date: "21 June 2026", time: "14:00", location: "Charité Campus Mitte",
    tags: ["HealthTech", "Biotech"], description: "Startups from the Charité ecosystem present their latest health and biotech demos.",
    spots: 200 },
  { id: 5, name: "Climate x Hardware Sprint", organiser: "Impact Hub Berlin", type: "Hackathon",
    date: "28 June 2026", time: "10:00", location: "Impact Hub, Kreuzberg",
    tags: ["ClimateTech", "Hardware", "Deep Tech"], description: "Build hardware prototypes addressing climate challenges. Teams of 3–5.",
    spots: 60 },
  { id: 6, name: "FinTech After Dark", organiser: "Berlin FinTech", type: "Meetup",
    date: "4 July 2026", time: "19:30", location: "Betahaus, Kreuzberg",
    tags: ["FinTech", "Payments", "Crypto"], description: "Informal drinks and pitches. Meet the people shaping fintech in Berlin.",
    spots: 150 },
  { id: 7, name: "BioTech Founders Dinner", organiser: "BioCity Berlin", type: "Meetup",
    date: "10 July 2026", time: "19:00", location: "BioCity Campus, Adlershof",
    tags: ["Biotech", "HealthTech"], description: "Exclusive dinner for founders and researchers working at the intersection of bio and tech.",
    spots: 25 },
  { id: 8, name: "EdTech Innovation Lab", organiser: "TU Berlin x BAD1", type: "Workshop",
    date: "17 July 2026", time: "09:00", location: "TU Berlin, MAR Building",
    tags: ["EdTech", "AI", "Product"], description: "A day of rapid prototyping for founders building the future of education.",
    spots: 40 },
];

type ProjectData = {
  id: number; company: string; name: string; description: string;
  deadline: string; budget: string; peopleRequired: number; tags: string[];
};

const MOCK_PROJECTS: ProjectData[] = [
  { id: 1, company: "Clausify", name: "ML Contract Parser", description: "Build an NLP pipeline to extract and classify key clauses from legal documents.",
    deadline: "30 June 2026", budget: "€3,000", peopleRequired: 2, tags: ["AI", "NLP", "Python"] },
  { id: 2, company: "Rootly", name: "IoT Sensor Dashboard", description: "Real-time dashboard for monitoring soil, humidity, and light across urban farming units.",
    deadline: "15 July 2026", budget: "€2,000", peopleRequired: 1, tags: ["IoT", "React", "Hardware"] },
  { id: 3, company: "Volara", name: "Mobility Data API", description: "Design and build a public REST API for aggregated city mobility data. Full docs required.",
    deadline: "31 July 2026", budget: "€5,000", peopleRequired: 2, tags: ["Backend", "Go", "API Design"] },
  { id: 4, company: "EcoTrace", name: "Carbon Tracking MVP", description: "Build the core data ingestion and reporting module for a carbon footprint SaaS product.",
    deadline: "20 July 2026", budget: "€4,500", peopleRequired: 3, tags: ["ClimateTech", "Full-stack", "React"] },
  { id: 5, company: "MedLink AI", name: "Patient Intake Chatbot", description: "Conversational AI to pre-screen patients and route them to the right department.",
    deadline: "10 August 2026", budget: "€6,000", peopleRequired: 2, tags: ["AI", "HealthTech", "LLM"] },
  { id: 6, company: "LearnLoop", name: "Adaptive Quiz Engine", description: "Build an adaptive question engine that adjusts difficulty based on learner performance.",
    deadline: "5 August 2026", budget: "€3,500", peopleRequired: 2, tags: ["EdTech", "AI", "Python"] },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function FilterBar({ hasIdea, setHasIdea, category, setCategory }: {
  hasIdea: boolean | null; setHasIdea: (v: boolean | null) => void;
  category: string; setCategory: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 mb-3">
      {/* Has idea toggle */}
      <div className="flex gap-2">
        {[{ val: null, label: "Everyone" }, { val: true, label: "💡 Has idea" }, { val: false, label: "🔍 No idea" }].map((opt) => (
          <button key={String(opt.val)} onClick={() => setHasIdea(opt.val as boolean | null)}
            className={`flex-shrink-0 text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
              hasIdea === opt.val ? "border-white/60 bg-white/10 text-white" : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/30"
            }`}>
            {opt.label}
          </button>
        ))}
      </div>
      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
          <button key={cat.id} onClick={() => setCategory(cat.id)}
            className={`flex-shrink-0 text-[11px] tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border transition-colors ${
              category === cat.id ? "border-white/60 bg-white/10 text-white" : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/30"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const EVENT_TYPE_EMOJI: Record<string, string> = { Hackathon: "⚡", Workshop: "🛠️", Meetup: "🤝", Conference: "🎤" };

function EventCard({ event, joined, onJoin }: { event: EventData; joined: boolean; onJoin: () => void }) {
  if (joined) return (
    <div className="border border-green-500/30 bg-green-500/5 rounded-3xl px-5 py-4 flex items-center gap-3">
      <span className="text-green-400 text-lg">✓</span>
      <div>
        <p className="text-sm font-semibold text-white">{event.name}</p>
        <p className="text-xs text-white/40">{event.date} · {event.time}</p>
      </div>
    </div>
  );
  return (
    <div className="border border-white/10 rounded-3xl bg-[#111] overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between mb-3">
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">
            {EVENT_TYPE_EMOJI[event.type]} {event.type}
          </span>
          <span className="text-[11px] text-white/40">📍 {event.location.split(",")[0]}</span>
        </div>
        <h2 className="text-[20px] font-bold tracking-tight leading-tight mb-1">{event.name}</h2>
        <p className="text-xs text-white/40 mb-1">{event.organiser}</p>
        <p className="text-sm text-white/50 leading-relaxed">{event.description}</p>
      </div>
      <div className="flex gap-5 px-5 pb-3">
        {[["Date", event.date], ["Time", event.time], ["Spots", String(event.spots)]].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/35">{label}</span>
            <span className="text-[13px] font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 px-5 pb-4">
        {event.tags.map((tag) => <span key={tag} className="text-[11px] text-white/70 border border-white/15 rounded-full px-2.5 py-0.5">{tag}</span>)}
      </div>
      <div className="px-5 pb-5">
        <button onClick={onJoin} className="w-full py-3 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold hover:bg-white/90 transition-colors">
          Register →
        </button>
      </div>
    </div>
  );
}

function ProjectCard({ project, applied, onApply, onDetails }: {
  project: ProjectData; applied?: boolean; onApply?: () => void; onDetails?: () => void;
}) {
  return (
    <div className="border border-white/10 rounded-3xl bg-[#111] px-5 py-4">
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">{project.company}</span>
        <span className="text-[11px] text-white/30">Due {project.deadline}</span>
      </div>
      <h3 className="text-[18px] font-bold tracking-tight mb-1">{project.name}</h3>
      <p className="text-sm text-white/50 mb-3 leading-relaxed line-clamp-2">{project.description}</p>
      <div className="flex gap-4 mb-3">
        {[["Budget", project.budget], ["People", String(project.peopleRequired)]].map(([label, value]) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.2em] uppercase text-white/35">{label}</span>
            <span className="text-[13px] font-medium text-white">{value}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {project.tags.map((t) => <span key={t} className="text-[11px] text-white/70 border border-white/15 rounded-full px-2.5 py-0.5">{t}</span>)}
      </div>
      <div className="flex gap-2">
        {onDetails && (
          <button onClick={onDetails} className="flex-shrink-0 px-4 py-2.5 rounded-2xl border border-white/15 text-sm text-white/50 hover:border-white/30 hover:text-white/80 transition-colors">
            Details
          </button>
        )}
        {applied ? (
          <div className="flex-1 py-2.5 rounded-2xl border border-green-500/30 bg-green-500/5 text-sm text-green-400 text-center">
            ✓ Applied
          </div>
        ) : (
          <button onClick={onApply} className="flex-1 py-2.5 rounded-2xl border border-white/20 text-sm text-white/70 hover:border-white/40 hover:text-white transition-colors">
            Apply →
          </button>
        )}
      </div>
    </div>
  );
}

// ── Business: Post form ────────────────────────────────────────────────────

const PROJECT_TAGS = ["AI", "HealthTech", "SpaceTech", "ClimateTech", "FinTech", "Biotech", "Hardware", "EdTech", "Web3", "Sustainability", "Backend", "Frontend", "Design", "Data", "Other"];

function PostProjectForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budget, setBudget] = useState("");
  const [people, setPeople] = useState("");
  const [website, setWebsite] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  async function handleSubmit() {
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, deadline, budget, people, website, tags: selectedTags }),
    });
    setLoading(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3 pb-6">
      <button onClick={onDone} className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 transition-colors text-left mb-2">← Back</button>
      <h2 className="text-xl font-bold tracking-tight mb-1">Post a project</h2>
      <p className="text-sm text-white/40 mb-2">Builders will browse and apply.</p>

      <input type="text" placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
      <input type="text" placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />

      {/* Category tags */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] tracking-[0.2em] uppercase text-white/35 px-1">Categories</label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_TAGS.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)}
              className={`text-[11px] px-3 py-1.5 rounded-full border transition-colors ${selectedTags.includes(tag) ? "border-white/60 bg-white/10 text-white" : "border-white/15 text-white/40 hover:border-white/30 hover:text-white/70"}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>
      <input type="text" placeholder="People required (e.g. 2)" value={people} onChange={(e) => setPeople(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />

      {/* Budget with € prefix */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/40 transition-colors">
        <span className="px-4 text-sm text-white/50 border-r border-white/10 py-[14px]">€</span>
        <input type="number" min="0" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)}
          className="flex-1 bg-transparent px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none" />
      </div>

      {/* Website link */}
      <input type="url" placeholder="Website / challenge link (optional)" value={website} onChange={(e) => setWebsite(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />

      {/* Deadline */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] tracking-[0.2em] uppercase text-white/35 px-1">Deadline</label>
        <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white focus:outline-none focus:border-white/40 transition-colors [color-scheme:dark]" />
      </div>

      <div className="h-px bg-white/6 my-2" />
      <button onClick={handleSubmit} disabled={!name || !description || !deadline || !budget || !people || loading}
        className="w-full py-4 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold disabled:opacity-30 hover:opacity-90 transition-opacity">
        {loading ? "Posting…" : "Post project →"}
      </button>
    </div>
  );
}

function CreateEventForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [topic, setTopic] = useState("");
  const [showLuma, setShowLuma] = useState(false);
  const [lumaUrl, setLumaUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location, date, topic, luma_url: lumaUrl || null }),
    });
    setLoading(false);
    onDone();
  }

  return (
    <div className="flex flex-col gap-3 pb-6">
      <button onClick={onDone} className="text-xs tracking-[0.15em] uppercase text-white/35 hover:text-white/60 transition-colors text-left mb-2">← Back</button>
      <h2 className="text-xl font-bold tracking-tight mb-1">Create an event</h2>
      <p className="text-sm text-white/40 mb-2">Workshops, hackathons, meetups — anything goes.</p>

      {/* Luma import */}
      {!showLuma ? (
        <button onClick={() => setShowLuma(true)}
          className="flex items-center justify-center gap-2 border border-white/15 rounded-xl px-4 py-3 text-sm text-white/50 hover:border-white/30 hover:text-white/80 transition-colors">
          <span className="text-base">🌐</span> Import from Luma
        </button>
      ) : (
        <div className="flex gap-2">
          <input type="url" placeholder="Paste Luma event URL…" value={lumaUrl} onChange={(e) => setLumaUrl(e.target.value)} autoFocus
            className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
          <button onClick={() => setShowLuma(false)}
            className="px-4 py-[14px] text-white/30 hover:text-white/60 transition-colors text-sm">✕</button>
        </div>
      )}

      <div className="h-px bg-white/6" />

      {[
        { placeholder: "Event name", value: name, set: setName },
        { placeholder: "Location", value: location, set: setLocation },
        { placeholder: "Topic (e.g. AI, HealthTech…)", value: topic, set: setTopic },
      ].map(({ placeholder, value, set }) => (
        <input key={placeholder} type="text" placeholder={placeholder} value={value} onChange={(e) => set(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-colors" />
      ))}

      <div className="flex flex-col gap-1">
        <label className="text-[10px] tracking-[0.2em] uppercase text-white/35 px-1">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-[14px] text-sm text-white focus:outline-none focus:border-white/40 transition-colors [color-scheme:dark]" />
      </div>

      <div className="h-px bg-white/6 my-2" />
      <button onClick={handleSubmit} disabled={!name || !location || !date || !topic || loading}
        className="w-full py-4 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold disabled:opacity-30 hover:opacity-90 transition-opacity">
        {loading ? "Creating…" : "Create event →"}
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type RoleKey = "builder" | "business";
type BuilderTab = "Co-founders" | "Projects" | "Events";
type BusinessView = "home" | "post-project" | "create-event";

export default function DiscoverPage() {
  const [role, setRole] = useState<RoleKey>("builder");
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewingAs, setViewingAs] = useState<RoleKey>("builder");
  const [userInitial, setUserInitial] = useState("·");

  // Builder state
  const [builderTab, setBuilderTab] = useState<BuilderTab>("Co-founders");
  const [ideaFilter, setIdeaFilter] = useState<boolean | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cardStack, setCardStack] = useState<CofounderCard[]>(ALL_COFOUNDERS);
  const [connectCount, setConnectCount] = useState(0);
  const [lastAction, setLastAction] = useState<"pass" | "connect" | null>(null);
  const [joinedEvents, setJoinedEvents] = useState<Set<string>>(new Set());
  const [appliedProjects, setAppliedProjects] = useState<Set<string>>(new Set());
  const [selectedCard, setSelectedCard] = useState<CofounderCard | null>(null);
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

  // Business state
  const [businessView, setBusinessView] = useState<BusinessView>("home");
  const [postedProjects, setPostedProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    // Check localStorage first (demo flow — set by new signup page)
    const localName = localStorage.getItem("scout_name");
    if (localName) setUserInitial(localName[0].toUpperCase());

    supabase.auth.getUser().then(({ data }) => {
      const meta = data.user?.user_metadata ?? {};
      const name = meta.full_name ?? data.user?.email ?? "";
      if (name && !localName) setUserInitial(name[0].toUpperCase());
      const userRole = meta.role as string;
      if (userRole === "admin") { setIsAdmin(true); }
      else { setRole((userRole as RoleKey) ?? "builder"); }
    });
    // Load persisted registrations and applications
    fetch("/api/event-registrations").then((r) => r.json()).then((ids: string[]) => {
      if (Array.isArray(ids)) setJoinedEvents(new Set(ids.map(String)));
    });
    fetch("/api/project-applications").then((r) => r.json()).then((ids: string[]) => {
      if (Array.isArray(ids)) setAppliedProjects(new Set(ids.map(String)));
    });
  }, []);

  // Recompute filtered cards when filters change
  useEffect(() => {
    let filtered = ALL_COFOUNDERS;
    if (ideaFilter !== null) filtered = filtered.filter((c) => c.hasIdea === ideaFilter);
    if (categoryFilter !== "all") filtered = filtered.filter((c) => c.categories.includes(categoryFilter));
    setCardStack(filtered);
  }, [ideaFilter, categoryFilter]);

  const effectiveRole: RoleKey = isAdmin ? viewingAs : role;
  const currentCard = cardStack[0];

  function handlePass() {
    setLastAction("pass");
    setCardStack((prev) => prev.slice(1));
    setTimeout(() => setLastAction(null), 800);
  }

  function handleConnect() {
    setLastAction("connect");
    if (cardStack[0]) addMatch(cardStack[0]);
    setConnectCount((c) => c + 1);
    setCardStack((prev) => prev.slice(1));
    setTimeout(() => setLastAction(null), 800);
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 pt-5 pb-2">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-sm">{userInitial}</div>
      </div>

      {/* Admin switcher */}
      {isAdmin && (
        <div className="px-5 pb-2">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-2xl px-3 py-2">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 flex-shrink-0">Viewing as</span>
            <div className="flex gap-1.5">
              {(["builder", "business"] as RoleKey[]).map((r) => (
                <button key={r} onClick={() => setViewingAs(r)}
                  className={`flex-shrink-0 text-[10px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full border transition-colors ${viewingAs === r ? "border-white/50 bg-white/10 text-white" : "border-white/10 text-white/35 hover:text-white/60"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Builder view ── */}
      {effectiveRole === "builder" && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 px-5 pb-2 overflow-x-auto no-scrollbar">
            {(["Co-founders", "Projects", "Events"] as BuilderTab[]).map((tab) => (
              <button key={tab} onClick={() => setBuilderTab(tab)}
                className={`flex-shrink-0 text-[11px] tracking-[0.15em] uppercase px-3.5 py-1.5 rounded-full border transition-colors ${builderTab === tab ? "border-white/60 text-white bg-white/10" : "border-white/15 text-white/40 hover:text-white/70 hover:border-white/30"}`}>
                {tab}
              </button>
            ))}
          </div>

          {lastAction === "connect" && (
            <div className="mx-6 mb-3 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2.5 text-sm text-green-400 text-center animate-pulse">✓ Connected!</div>
          )}

          <div className="flex-1 flex flex-col px-5 pt-1">
            {builderTab === "Co-founders" && (
              <>
                <FilterBar hasIdea={ideaFilter} setHasIdea={setIdeaFilter} category={categoryFilter} setCategory={setCategoryFilter} />
                {currentCard ? (
                  <>
                    <SwipeCard key={currentCard.id} card={currentCard} onPass={handlePass} onConnect={handleConnect} onCardClick={() => setSelectedCard(currentCard)} />
                    <div className="flex items-center justify-center gap-8 mt-6">
                      <button onClick={handlePass} className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-red-400/60 hover:text-red-400 transition-colors text-2xl">✕</button>
                      <button onClick={handleConnect} className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center text-[#0a0a0a] hover:bg-white/90 transition-colors text-3xl">♥</button>
                    </div>
                    <p className="text-center text-[11px] text-white/20 mt-4 tracking-[0.1em] uppercase">{cardStack.length} left · {connectCount} connected</p>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-20">
                    <div className="text-4xl">🎉</div>
                    <h2 className="text-xl font-bold tracking-tight">All caught up</h2>
                    <p className="text-sm text-white/40">Try adjusting your filters or check back soon.</p>
                  </div>
                )}
              </>
            )}

            {builderTab === "Projects" && (
              <div className="flex flex-col gap-4 pb-4">
                {MOCK_PROJECTS.map((p) => (
                  <ProjectCard key={p.id} project={p}
                    applied={appliedProjects.has(String(p.id))}
                    onApply={async () => {
                      const id = String(p.id);
                      setAppliedProjects((prev) => new Set([...prev, id]));
                      await fetch("/api/project-applications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ project_id: id }),
                      });
                    }}
                    onDetails={() => setSelectedProject(p)}
                  />
                ))}
              </div>
            )}

            {builderTab === "Events" && (
              <div className="flex flex-col gap-4 pb-4">
                {EVENTS.map((event) => (
                  <EventCard key={event.id} event={event} joined={joinedEvents.has(String(event.id))}
                    onJoin={async () => {
                      const id = String(event.id);
                      setJoinedEvents((prev) => new Set([...prev, id]));
                      await fetch("/api/event-registrations", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ event_id: id }),
                      });
                    }} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Business view ── */}
      {effectiveRole === "business" && (
        <div className="flex-1 flex flex-col px-5 pt-2">
          {businessView === "home" && (
            <>
              <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
              <p className="text-sm text-white/40 mb-6">Post projects and run events for the BAD1 community.</p>

              <div className="flex flex-col gap-3 mb-8">
                <button onClick={() => setBusinessView("post-project")}
                  className="flex items-center gap-4 border border-white/10 rounded-2xl px-4 py-4 hover:border-white/25 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-xl">📋</div>
                  <div>
                    <p className="font-semibold text-sm text-white">Post a project</p>
                    <p className="text-xs text-white/40 mt-0.5">Describe a real problem, set a budget, and let BAD1 builders propose solutions</p>
                  </div>
                  <span className="ml-auto text-white/20 text-xs">›</span>
                </button>
                <button onClick={() => setBusinessView("create-event")}
                  className="flex items-center gap-4 border border-white/10 rounded-2xl px-4 py-4 hover:border-white/25 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-xl">⚡</div>
                  <div>
                    <p className="font-semibold text-sm text-white">Create an event</p>
                    <p className="text-xs text-white/40 mt-0.5">Hackathons, workshops, meetups</p>
                  </div>
                  <span className="ml-auto text-white/20 text-xs">›</span>
                </button>
              </div>

              {/* Active projects */}
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">Your projects</p>
              {[...MOCK_PROJECTS, ...postedProjects].length === 0 ? (
                <p className="text-sm text-white/30">No projects yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...MOCK_PROJECTS, ...postedProjects].map((p) => <ProjectCard key={p.id} project={p} />)}
                </div>
              )}
            </>
          )}

          {businessView === "post-project" && (
            <PostProjectForm onDone={() => setBusinessView("home")} />
          )}

          {businessView === "create-event" && (
            <CreateEventForm onDone={() => setBusinessView("home")} />
          )}
        </div>
      )}

      <BottomNav />

      {/* Project detail modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setSelectedProject(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-[#111] border border-white/12 rounded-t-3xl px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />
            <div className="flex items-start justify-between mb-3">
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">{selectedProject.company}</span>
              <span className="text-[11px] text-white/30">Due {selectedProject.deadline}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">{selectedProject.name}</h2>
            <p className="text-sm text-white/60 leading-relaxed mb-5">{selectedProject.description}</p>
            <div className="h-px bg-white/8 mb-5" />
            <div className="flex gap-6 flex-wrap mb-5">
              {[["Budget", selectedProject.budget], ["People needed", String(selectedProject.peopleRequired)]].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-white/35">{label}</span>
                  <span className="text-[13px] font-medium text-white">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-6">
              {selectedProject.tags.map((t) => <span key={t} className="text-[11px] text-white/70 border border-white/15 rounded-full px-2.5 py-0.5">{t}</span>)}
            </div>
            {appliedProjects.has(String(selectedProject.id)) ? (
              <div className="w-full py-3.5 rounded-2xl border border-green-500/30 bg-green-500/5 text-sm text-green-400 text-center">✓ Application sent</div>
            ) : (
              <button onClick={async () => {
                const id = String(selectedProject.id);
                setAppliedProjects((prev) => new Set([...prev, id]));
                await fetch("/api/project-applications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ project_id: id }),
                });
                setSelectedProject(null);
              }} className="w-full py-3.5 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold hover:bg-white/90 transition-colors">
                Apply →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Profile detail modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center" onClick={() => setSelectedCard(null)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg bg-[#111] border border-white/12 rounded-t-3xl px-5 pt-5 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">{selectedCard.type}</span>
              <span className="text-[11px] text-white/40">📍 {selectedCard.location}</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight mb-1">{selectedCard.name}</h2>
            <p className="text-sm text-white/55 leading-relaxed mb-5">{selectedCard.tagline}</p>

            <div className="h-px bg-white/8 mb-5" />

            {/* Meta */}
            <div className="flex gap-6 flex-wrap mb-5">
              {selectedCard.meta.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-white/35">{label}</span>
                  <span className="text-[13px] font-medium text-white">{value}</span>
                </div>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {selectedCard.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-white/70 border border-white/15 rounded-full px-2.5 py-0.5">{tag}</span>
              ))}
            </div>

            {/* Looking for */}
            <div className="bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-3 mb-5">
              <p className="text-[9px] tracking-[0.2em] uppercase text-white/35 mb-1">Looking for</p>
              <p className="text-[13px] font-medium text-white/85">{selectedCard.lookingFor}</p>
            </div>

            {/* Contact */}
            {selectedCard.contact && (
              <div className="bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-4 mb-6">
                <p className="text-[9px] tracking-[0.2em] uppercase text-white/35 mb-3">Contact</p>
                <div className="flex flex-col gap-2.5">
                  {selectedCard.contact.email && (
                    <a href={`mailto:${selectedCard.contact.email}`}
                      className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors">
                      <span className="text-base">✉️</span>
                      <span className="font-mono text-[13px]">{selectedCard.contact.email}</span>
                    </a>
                  )}
                  {selectedCard.contact.linkedin && (
                    <a href={`https://${selectedCard.contact.linkedin}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-sm text-white/80 hover:text-white transition-colors">
                      <span className="text-base">🔗</span>
                      <span className="text-[13px]">{selectedCard.contact.linkedin}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button onClick={() => { handlePass(); setSelectedCard(null); }}
                className="flex-1 py-3.5 rounded-2xl border border-white/15 text-sm text-white/50 hover:border-red-400/50 hover:text-red-400 transition-colors">
                Decline
              </button>
              <button onClick={() => { handleConnect(); setSelectedCard(null); }}
                className="flex-1 py-3.5 rounded-2xl bg-white text-[#0a0a0a] text-sm font-semibold hover:bg-white/90 transition-colors">
                Match ♥
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
