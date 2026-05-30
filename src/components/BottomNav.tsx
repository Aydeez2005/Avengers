"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    href: "/connections",
    label: "Network",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
        <line x1="12" y1="7" x2="5" y2="17"/><line x1="12" y1="7" x2="19" y2="17"/>
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

const LAST_SEEN_KEY = "scout_matches_last_seen";

export default function BottomNav() {
  const pathname = usePathname();
  const [isBusiness, setIsBusiness] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const currentUserIdRef = useRef<string | null>(null);
  const onMatchesPage = pathname.startsWith("/matches");

  // When user visits matches page, record the timestamp so future messages are "new"
  useEffect(() => {
    if (onMatchesPage) {
      localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
      setBadgeCount(0);
    }
  }, [onMatchesPage]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      currentUserIdRef.current = user.id;
      setIsBusiness(user.user_metadata?.role === "business");

      const lastSeen = localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString();

      // Count pending invites + unread messages since last visit
      Promise.all([
        fetch("/api/match-invites").then((r) => r.json()).catch(() => []),
        fetch("/api/matches").then((r) => r.json()).catch(() => []),
      ]).then(async ([invs, matches]) => {
        const pendingInvites = Array.isArray(invs) ? invs.length : 0;

        // Count unread messages across all match chats
        let unreadMessages = 0;
        if (Array.isArray(matches) && matches.length > 0) {
          const messageChecks = matches.map((m: { id: string }) =>
            fetch(`/api/messages/${m.id}`)
              .then((r) => r.json())
              .then((msgs: Array<{ sender_id: string; created_at: string }>) => {
                if (!Array.isArray(msgs)) return 0;
                return msgs.filter(
                  (msg) =>
                    msg.sender_id !== user.id &&
                    msg.created_at > lastSeen
                ).length;
              })
              .catch(() => 0)
          );
          const counts = await Promise.all(messageChecks);
          unreadMessages = counts.reduce((a, b) => a + b, 0);
        }

        if (!onMatchesPage) {
          setBadgeCount(pendingInvites + unreadMessages);
        }
      });
    });

    // Realtime: new invite received
    const inviteChannel = supabase
      .channel("nav-invites")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_invites" }, () => {
        if (onMatchesPage) return;
        setBadgeCount((c) => c + 1);
      })
      .subscribe();

    // Realtime: new message received (any match the user is part of — RLS filters it)
    const msgChannel = supabase
      .channel("nav-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          if (onMatchesPage) return;
          const msg = payload.new as { sender_id: string };
          if (msg.sender_id !== currentUserIdRef.current) {
            setBadgeCount((c) => c + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inviteChannel);
      supabase.removeChannel(msgChannel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleTabs = isBusiness
    ? TABS.filter((t) => t.href !== "/matches" && t.href !== "/connections")
    : TABS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex justify-around items-center px-6 pb-8 pt-3 border-t border-white/6 bg-[#0a0a0a]/95 backdrop-blur-sm z-50">
      {visibleTabs.map(({ href, label, icon }) => {
        const active = pathname.startsWith(href);
        const showBadge = href === "/matches" && badgeCount > 0 && !active;
        return (
          <Link
            key={href}
            href={href}
            className={`relative flex flex-col items-center gap-1 transition-colors ${active ? "text-white" : "text-white/30 hover:text-white/60"}`}
          >
            <div className="relative">
              {icon(active)}
              {showBadge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white leading-none">
                  {badgeCount > 9 ? "9+" : badgeCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-[0.1em] uppercase">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
