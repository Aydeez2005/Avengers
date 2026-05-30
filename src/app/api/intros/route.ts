import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

// POST /api/intros
// Body: { bridgeId, targetProfileId? | targetExternalId?, goal, context?, draftMessage? }
// Effect: creates an intro request that the bridge will see in their inbox.
//
// Authorization rule: the requester must actually have an edge to the bridge,
// AND the bridge must have an edge to the target. We verify both here so a
// user can't request intros through people they don't know.

export async function POST(request: NextRequest) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "invalid json" }, { status: 400 });

  const { bridgeId, targetProfileId, targetExternalId, goal, context, draftMessage } = body as {
    bridgeId?: string;
    targetProfileId?: string;
    targetExternalId?: string;
    goal?: string;
    context?: string;
    draftMessage?: string;
  };

  if (!bridgeId || !goal) {
    return NextResponse.json({ error: "bridgeId and goal required" }, { status: 400 });
  }
  if (!targetProfileId && !targetExternalId) {
    return NextResponse.json({ error: "target required" }, { status: 400 });
  }
  if (bridgeId === user.id) {
    return NextResponse.json({ error: "cannot request intro from yourself" }, { status: 400 });
  }

  // 1. Requester must know bridge.
  const { data: requesterToBridge } = await admin
    .from("connections")
    .select("id")
    .eq("from_profile_id", user.id)
    .eq("to_profile_id", bridgeId)
    .maybeSingle();
  if (!requesterToBridge) {
    return NextResponse.json(
      { error: "you are not connected to the bridge person" },
      { status: 403 }
    );
  }

  // 2. Bridge must know target.
  const bridgeEdgeQuery = admin
    .from("connections")
    .select("id")
    .eq("from_profile_id", bridgeId);
  const { data: bridgeToTarget } = targetProfileId
    ? await bridgeEdgeQuery.eq("to_profile_id", targetProfileId).maybeSingle()
    : await bridgeEdgeQuery.eq("to_external_id", targetExternalId!).maybeSingle();
  if (!bridgeToTarget) {
    return NextResponse.json(
      { error: "bridge does not appear to know the target" },
      { status: 403 }
    );
  }

  const { data: intro, error } = await admin
    .from("intros")
    .insert({
      requester_id: user.id,
      bridge_id: bridgeId,
      target_profile_id: targetProfileId ?? null,
      target_external_id: targetExternalId ?? null,
      goal,
      context: context ?? null,
      draft_message: draftMessage ?? null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ intro });
}

// GET /api/intros?role=requester|bridge|target  (default: all)
// Fails soft when the schema isn't applied yet — returns empty list so the
// /connections Inbox tab stays silent in demo mode.
export async function GET(request: NextRequest) {
  let userId: string;
  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }
  const admin = getAdminSupabase();
  const role = new URL(request.url).searchParams.get("role");

  try {
    let q = admin.from("intros").select("*").order("created_at", { ascending: false });
    if (role === "requester") q = q.eq("requester_id", userId);
    else if (role === "bridge") q = q.eq("bridge_id", userId);
    else if (role === "target") q = q.eq("target_profile_id", userId);
    else q = q.or(`requester_id.eq.${userId},bridge_id.eq.${userId},target_profile_id.eq.${userId}`);

    const { data, error } = await q;
    if (error) throw error;
    return NextResponse.json({ intros: data });
  } catch (e) {
    console.error("intros GET failed", e);
    return NextResponse.json({ intros: [] });
  }
}
