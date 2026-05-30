import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/intros/[id]/messages — thread for a specific intro.
// POST /api/intros/[id]/messages { body } — send a new message.
//
// Server checks the caller is one of (requester, bridge, target). Target can
// only message once status >= 'forwarded'. Requester can message once
// status >= 'forwarded' too (bridge has made the intro).

async function loadIntro(id: string, admin: ReturnType<typeof getAdminSupabase>) {
  const { data: intro } = await admin
    .from("intros")
    .select("id, requester_id, bridge_id, target_profile_id, status")
    .eq("id", id)
    .single();
  return intro;
}

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/intros/[id]/messages">) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();
  const { id } = await ctx.params;

  const intro = await loadIntro(id, admin);
  if (!intro) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (![intro.requester_id, intro.bridge_id, intro.target_profile_id].includes(user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await admin
    .from("intro_messages")
    .select("*")
    .eq("intro_id", id)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ messages: data });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/intros/[id]/messages">) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const text = (body?.body as string | undefined)?.trim();
  if (!text) return NextResponse.json({ error: "body required" }, { status: 400 });

  const intro = await loadIntro(id, admin);
  if (!intro) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isRequester = intro.requester_id === user.id;
  const isBridge = intro.bridge_id === user.id;
  const isTarget = intro.target_profile_id === user.id;
  if (!isRequester && !isBridge && !isTarget) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // Target & requester can only post once the bridge has forwarded the intro.
  if ((isTarget || isRequester) && intro.status === "pending") {
    return NextResponse.json(
      { error: "waiting for the bridge to make the intro" },
      { status: 400 }
    );
  }
  if (intro.status === "declined" || intro.status === "expired") {
    return NextResponse.json({ error: "intro is closed" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("intro_messages")
    .insert({ intro_id: id, sender_id: user.id, body: text })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: data });
}
