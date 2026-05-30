"use client";

import { useState } from "react";

export type CardData = {
  id: number;
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
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [didDrag, setDidDrag] = useState(false);

  const rotation = dragX * 0.08;
  const passOpacity = Math.min(Math.max(-dragX / 80, 0), 1);
  const connectOpacity = Math.min(Math.max(dragX / 80, 0), 1);

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true);
    setStartX(e.clientX);
    setDidDrag(false);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
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
    if (dragX < -80) { onPass(); }
    else if (dragX > 80) { onConnect(); }
    setDragX(0);
    setDidDrag(false);
  }

  return (
    <div className="relative w-full select-none" style={{ touchAction: "none" }}>
      {/* Stack shadows */}
      <div className="absolute top-[10px] left-[10px] right-[10px] h-[440px] bg-white/[0.03] border border-white/[0.06] rounded-3xl" />
      <div className="absolute top-[5px] left-[5px] right-[5px] h-[440px] bg-white/[0.05] border border-white/[0.08] rounded-3xl" />

      {/* Mobile swipe hint labels — always faintly visible */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-1 z-20 flex flex-col items-center gap-0.5 pointer-events-none"
        style={{ opacity: Math.max(0.18, passOpacity) }}>
        <span className="text-red-400 text-lg leading-none">←</span>
        <span className="text-[9px] tracking-[0.15em] uppercase text-red-400 -rotate-90 whitespace-nowrap">Decline</span>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 -right-1 z-20 flex flex-col items-center gap-0.5 pointer-events-none"
        style={{ opacity: Math.max(0.18, connectOpacity) }}>
        <span className="text-green-400 text-lg leading-none">→</span>
        <span className="text-[9px] tracking-[0.15em] uppercase text-green-400 rotate-90 whitespace-nowrap">Match</span>
      </div>

      {/* Main card */}
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative bg-[#111] border border-white/12 rounded-3xl h-[440px] flex flex-col overflow-hidden cursor-grab active:cursor-grabbing transition-shadow"
        style={{
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.2,0.8,0.2,1)",
        }}
      >
        {/* Swipe hints */}
        <div className="absolute top-6 left-5 text-[11px] tracking-[0.2em] uppercase text-red-400 border border-red-400 rounded-md px-2 py-0.5 transition-opacity" style={{ opacity: passOpacity }}>
          Pass
        </div>
        <div className="absolute top-6 right-5 text-[11px] tracking-[0.2em] uppercase text-green-400 border border-green-400 rounded-md px-2 py-0.5 transition-opacity" style={{ opacity: connectOpacity }}>
          Connect
        </div>

        {/* Tap hint */}
        <div className="absolute bottom-[76px] right-5 text-[9px] tracking-[0.15em] uppercase text-white/20 pointer-events-none">
          tap for details
        </div>

        {/* Card header */}
        <div className="flex items-start justify-between px-5 pt-5">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/40 border border-white/15 rounded-full px-3 py-1">
            {card.type}
          </span>
          <span className="text-[11px] text-white/40">📍 {card.location}</span>
        </div>

        {/* Card body */}
        <div className="flex-1 px-5 pt-4 flex flex-col justify-between">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight leading-tight">{card.name}</h2>
            <p className="text-sm text-white/55 mt-1.5 leading-relaxed">{card.tagline}</p>

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

          <div className="bg-white/[0.04] border border-white/8 rounded-xl px-3.5 py-3 mb-1">
            <p className="text-[9px] tracking-[0.2em] uppercase text-white/35 mb-1">Looking for</p>
            <p className="text-[13px] font-medium text-white/85">{card.lookingFor}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
