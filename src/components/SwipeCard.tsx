"use client";

import { useRef, useState } from "react";

export type CardData = {
  id: number;
  userId?: string;
  type: "Startup" | "Co-founder" | "Researcher" | "Student";
  name: string;
  tagline: string;
  location: string;
  tags: string[];
  lookingFor: string;
  meta: { label: string; value: string }[];
  contact?: { email?: string; linkedin?: string };
};

interface SwipeCardProps {
  card: CardData;
  onPass: () => void;
  onConnect: () => void;
  onCardClick?: () => void;
}

export default function SwipeCard({ card, onPass, onConnect, onCardClick }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [didDrag, setDidDrag] = useState(false);

  const rotation = dragX * 0.06;
  const passOpacity = Math.min(Math.max(-dragX / 80, 0), 1);
  const connectOpacity = Math.min(Math.max(dragX / 80, 0), 1);
  const THRESHOLD = 90;

  function onPointerDown(e: React.PointerEvent) {
    // Always capture on the card element, not e.target
    cardRef.current?.setPointerCapture(e.pointerId);
    setDragging(true);
    setStartX(e.clientX);
    setDidDrag(false);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    setDragX(dx);
    if (Math.abs(dx) > 8) setDidDrag(true);
  }

  function onPointerUp() {
    if (!dragging) return;
    setDragging(false);
    if (!didDrag) {
      setDragX(0);
      onCardClick?.();
      return;
    }
    if (dragX < -THRESHOLD) { onPass(); }
    else if (dragX > THRESHOLD) { onConnect(); }
    setDragX(0);
    setDidDrag(false);
  }

  return (
    <div className="relative w-full select-none overflow-hidden" style={{ touchAction: "pan-y" }}>
      {/* Stack depth shadows — inside overflow:hidden so they never spill */}
      <div className="absolute top-[8px] left-[8px] right-[8px] bottom-0 bg-white/[0.03] border border-white/[0.06] rounded-3xl" />
      <div className="absolute top-[4px] left-[4px] right-[4px] bottom-0 bg-white/[0.05] border border-white/[0.08] rounded-3xl" />

      {/* Main card */}
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative bg-[#111] border border-white/[0.12] rounded-3xl flex flex-col overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          height: "min(440px, 64vh)",
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transformOrigin: "center bottom",
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.2,0.8,0.2,1)",
          willChange: "transform",
        }}
      >
        {/* Swipe overlays — PASS left, CONNECT right */}
        <div
          className="absolute inset-0 flex items-center justify-start pl-6 pointer-events-none z-10 rounded-3xl"
          style={{ opacity: passOpacity, background: "linear-gradient(90deg, rgba(239,68,68,0.15) 0%, transparent 60%)" }}
        >
          <div className="border-2 border-red-400 rounded-xl px-3 py-1.5 rotate-[-12deg]">
            <span className="text-red-400 text-sm font-bold tracking-widest uppercase">Decline</span>
          </div>
        </div>
        <div
          className="absolute inset-0 flex items-center justify-end pr-6 pointer-events-none z-10 rounded-3xl"
          style={{ opacity: connectOpacity, background: "linear-gradient(270deg, rgba(34,197,94,0.15) 0%, transparent 60%)" }}
        >
          <div className="border-2 border-green-400 rounded-xl px-3 py-1.5 rotate-[12deg]">
            <span className="text-green-400 text-sm font-bold tracking-widest uppercase">Match</span>
          </div>
        </div>

        {/* Card header */}
        <div className="flex items-start justify-between px-5 pt-5">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">
            {card.type}
          </span>
          <span className="text-[11px] text-white/40">📍 {card.location}</span>
        </div>

        {/* Card body */}
        <div className="flex-1 px-5 pt-4 flex flex-col justify-between min-h-0">
          <div className="overflow-hidden">
            <h2 className="text-[22px] font-bold tracking-tight leading-tight">{card.name}</h2>
            <p className="text-sm text-white/55 mt-1.5 leading-relaxed line-clamp-2">{card.tagline}</p>

            <div className="h-px bg-white/8 my-4" />

            <div className="flex gap-4 flex-wrap">
              {card.meta.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-white/35">{label}</span>
                  <span className="text-[13px] font-medium text-white">{value}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {card.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-white/70 border border-white/15 rounded-full px-2.5 py-0.5">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-3 mb-3 mt-3">
            <p className="text-[9px] tracking-[0.2em] uppercase text-white/35 mb-1">Looking for</p>
            <p className="text-[13px] font-medium text-white/85 line-clamp-1">{card.lookingFor}</p>
          </div>
        </div>

        {/* Tap hint */}
        <div className="absolute bottom-3 right-4 text-[9px] tracking-[0.12em] uppercase text-white/20 pointer-events-none">
          tap for details
        </div>
      </div>
    </div>
  );
}
