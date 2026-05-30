import BottomNav from "@/components/BottomNav";

const SECTIONS = [
  {
    title: "Profile",
    items: ["Edit profile", "My roles", "Skills & interests", "Profile photo"],
  },
  {
    title: "Discovery",
    items: ["Who I want to meet", "Location radius", "Hide my profile"],
  },
  {
    title: "Account",
    items: ["Email & password", "Notifications", "Privacy settings"],
  },
  {
    title: "More",
    items: ["About Scout", "Give feedback", "Sign out"],
  },
];

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col pb-24">
      <div className="px-6 pt-5 pb-4">
        <span className="text-xs font-bold tracking-[0.25em] uppercase text-white/90">Scout</span>
      </div>

      <div className="px-6">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/8 border border-white/10 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Alice Zhai</h2>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {["Student", "Co-founder"].map((role) => (
                <span key={role} className="text-[10px] tracking-[0.1em] uppercase text-white/50 border border-white/15 rounded-full px-2 py-0.5">
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-2 px-1">
                {section.title}
              </p>
              <div className="border border-white/8 rounded-2xl overflow-hidden">
                {section.items.map((item, i) => (
                  <button
                    key={item}
                    className={`w-full text-left px-4 py-3.5 text-sm text-white/80 hover:bg-white/[0.03] hover:text-white transition-colors flex items-center justify-between ${
                      i < section.items.length - 1 ? "border-b border-white/6" : ""
                    } ${item === "Sign out" ? "text-red-400/70 hover:text-red-400" : ""}`}
                  >
                    {item}
                    {item !== "Sign out" && (
                      <span className="text-white/20 text-xs">›</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
