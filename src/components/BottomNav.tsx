"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TABS = [
  {
    href: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    businessLabel: "My Posts",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/>
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [isBusiness, setIsBusiness] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsBusiness(data.user?.user_metadata?.role === "business");
    });
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-6 pb-8 pt-3 border-t border-white/6 bg-[#0a0a0a]/95 backdrop-blur-sm z-50">
      {TABS.map(({ href, label, icon, ...rest }) => {
        const active = pathname.startsWith(href);
        const displayLabel = isBusiness && "businessLabel" in rest ? rest.businessLabel : label;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 transition-colors ${active ? "text-white" : "text-white/30 hover:text-white/60"}`}
          >
            {icon(active)}
            <span className="text-[10px] tracking-[0.1em] uppercase">{displayLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
