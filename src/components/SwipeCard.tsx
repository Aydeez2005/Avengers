"use client";

import { useRef, useState } from "react";

export type CardData = {
  id: number;
  userId?: string;
  avatarUrl?: string;
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
    <div className="relative w-full h-full select-none overflow-hidden" style={{ touchAction: "pan-y" }}>
      {/* Stack depth shadows */}
      <div className="absolute top-[8px] left-[8px] right-[8px] bottom-0 bg-white/[0.03] border border-white/[0.06] rounded-3xl" />
      <div className="absolute top-[4px] left-[4px] right-[4px] bottom-0 bg-white/[0.05] border border-white/[0.08] rounded-3xl" />

      {/* Main card */}
      <div
        ref={cardRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative border border-white/[0.12] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          height: "100%",
          transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
          transformOrigin: "center bottom",
          transition: dragging ? "none" : "transform 0.3s cubic-bezier(0.2,0.8,0.2,1)",
          willChange: "transform",
        }}
      >
        {/* Full-card background */}
        {card.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.avatarUrl}
            alt={card.name}
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-[#0a0a0a] flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-4xl font-bold text-white/40">
              {card.name[0]?.toUpperCase()}
            </div>
          </div>
        )}

        {/* Dark gradient from bottom — makes text readable over photo */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.1) 70%, transparent 100%)" }}
        />

        {/* Swipe overlays */}
        <div
          className="absolute inset-0 flex items-center justify-start pl-8 pointer-events-none z-10 rounded-3xl"
          style={{ opacity: passOpacity, background: "linear-gradient(90deg, rgba(239,68,68,0.35) 0%, transparent 70%)" }}
        >
          <div className="flex flex-col items-center gap-1 rotate-[-12deg]">
            <div className="w-16 h-16 rounded-full border-4 border-red-400 flex items-center justify-center bg-black/30">
              <span className="text-red-400 text-3xl font-bold leading-none">✕</span>
            </div>
            <span className="text-red-400 text-xs font-bold tracking-widest uppercase">Decline</span>
          </div>
        </div>
        <div
          className="absolute inset-0 flex items-center justify-end pr-8 pointer-events-none z-10 rounded-3xl"
          style={{ opacity: connectOpacity, background: "linear-gradient(270deg, rgba(34,197,94,0.35) 0%, transparent 70%)" }}
        >
          <div className="flex flex-col items-center gap-1 rotate-[12deg]">
            <div className="w-16 h-16 rounded-full border-4 border-green-400 flex items-center justify-center bg-black/30">
              <span className="text-green-400 text-3xl leading-none">♥</span>
            </div>
            <span className="text-green-400 text-xs font-bold tracking-widest uppercase">Match</span>
          </div>
        </div>

        {/* Top row: type + location */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <span className="text-[10px] tracking-[0.25em] uppercase text-white/80 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1">
            {card.type}
          </span>
          <span className="text-[11px] text-white/70 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1">
            📍 {card.location}
          </span>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8 z-10">
          <h2 className="text-[22px] font-bold tracking-tight leading-tight text-white">{card.name}</h2>
          <p className="text-sm text-white/70 mt-1 leading-relaxed line-clamp-2">{card.tagline}</p>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {card.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="text-[11px] text-white/80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-2.5 py-0.5">
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-3 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl px-3.5 py-2.5">
            <p className="text-[9px] tracking-[0.2em] uppercase text-white/40 mb-0.5">Looking for</p>
            <p className="text-[13px] font-medium text-white/90 line-clamp-1">{card.lookingFor}</p>
          </div>

          <p className="text-center text-[9px] tracking-[0.12em] uppercase text-white/25 mt-3">tap for details</p>
        </div>
      </div>
    </div>
  );
}
