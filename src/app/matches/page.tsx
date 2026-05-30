import BottomNav from "@/components/BottomNav";

const MOCK_MATCHES = [
  { id: 1, name: "Clausify", type: "Startup", tagline: "AI that reads contracts so lawyers don't have to", time: "2m ago" },
  { id: 2, name: "Jonas Weber", type: "Co-founder", tagline: "Ex-McKinsey, building in climate tech", time: "1h ago" },
];

export default function MatchesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      <div className="px-6 pt-5 pb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
      </div>

      <div className="px-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Matches</h1>
        <p className="text-sm text-white/40 mb-6">People who connected back with you</p>

        {MOCK_MATCHES.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 gap-4">
            <div className="text-4xl">💬</div>
            <p className="text-sm text-white/40">No matches yet — keep swiping!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {MOCK_MATCHES.map((m) => (
              <div key={m.id} className="flex items-center gap-4 border border-white/10 rounded-2xl p-4 hover:border-white/25 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                  {m.type === "Startup" ? "🚀" : m.type === "Co-founder" ? "🤝" : m.type === "Researcher" ? "🔬" : "🎓"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white truncate">{m.name}</span>
                    <span className="text-[10px] text-white/30 flex-shrink-0">{m.time}</span>
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
