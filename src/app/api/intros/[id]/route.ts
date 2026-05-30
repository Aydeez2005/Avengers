import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

// PATCH /api/intros/[id]
// Body: { action: 'accept' | 'decline', message?: string }
//
// Bridge accepting:   status pending → forwarded.
//                     The agent's draft (or `message` override) becomes the first thread message
//                     from the bridge, so the target sees a real intro the moment it lands.
// Bridge declining:   status pending → declined.
// Target accepting:   status forwarded → connected. Calendly becomes visible to requester.
// Target declining:   status forwarded → declined.
//
// We don't let the requester PATCH — they can only cancel (future work).

export async function PATCH(req: NextRequest, ctx: RouteContext<"/api/intros/[id]">) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const action = body?.action as "accept" | "decline" | undefined;
  const message = body?.message as string | undefined;
  if (action !== "accept" && action !== "decline") {
    return NextResponse.json({ error: "action must be accept|decline" }, { status: 400 });
  }

  const { data: intro, error } = await admin
    .from("intros")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !intro) return NextResponse.json({ error: "intro not found" }, { status: 404 });

  const isBridge = intro.bridge_id === user.id;
  const isTarget = intro.target_profile_id === user.id;
  if (!isBridge && !isTarget) {
    return NextResponse.json({ error: "not your intro to action" }, { status: 403 });
  }

  let nextStatus: string | null = null;
  let firstMessage: string | null = null;

  if (isBridge && intro.status === "pending") {
    nextStatus = action === "accept" ? "forwarded" : "declined";
    if (action === "accept") {
      firstMessage = message?.trim() || intro.draft_message || `Hey — quick intro. ${intro.goal}`;
    }
  } else if (isTarget && intro.status === "forwarded") {
    nextStatus = action === "accept" ? "connected" : "declined";
  } else {
    return NextResponse.json(
      { error: `cannot ${action} from status ${intro.status} as ${isBridge ? "bridge" : "target"}` },
      { status: 400 }
    );
  }

  const { error: updateErr } = await admin
    .from("intros")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (firstMessage) {
    await admin.from("intro_messages").insert({
      intro_id: id,
      sender_id: user.id,
      body: firstMessage,
    });
  }

  return NextResponse.json({ ok: true, status: nextStatus });
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/intros/[id]">) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();
  const { id } = await ctx.params;

  const { data: intro, error } = await admin.from("intros").select("*").eq("id", id).single();
  if (error || !intro) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (![intro.requester_id, intro.bridge_id, intro.target_profile_id].includes(user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Hydrate the three parties for the UI.
  const ids = [intro.requester_id, intro.bridge_id, intro.target_profile_id].filter(Boolean);
  const { data: people } = await admin
    .from("profiles")
    .select("id, full_name, headline, current_company, current_title, calendly_url")
    .in("id", ids);

  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  return NextResponse.json({
    intro,
    requester: byId.get(intro.requester_id) ?? null,
    bridge: byId.get(intro.bridge_id) ?? null,
    target: byId.get(intro.target_profile_id) ?? null,
    role:
      intro.requester_id === user.id ? "requester" :
      intro.bridge_id === user.id ? "bridge" : "target",
  });
}
