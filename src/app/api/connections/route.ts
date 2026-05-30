import { NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/connections — stats for the current user's graph.
// Returns zeros gracefully if the schema isn't applied yet, so the
// /connections page demo never errors on load.
export async function GET() {
  let userId: string;
  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const admin = getAdminSupabase();
  try {
    const [{ count: profileEdges }, { count: externalEdges }, { count: contacts }] = await Promise.all([
      admin
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("from_profile_id", userId)
        .not("to_profile_id", "is", null),
      admin
        .from("connections")
        .select("*", { count: "exact", head: true })
        .eq("from_profile_id", userId)
        .not("to_external_id", "is", null),
      admin
        .from("external_contacts")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", userId),
    ]);

    return NextResponse.json({
      profileEdges: profileEdges ?? 0,
      externalEdges: externalEdges ?? 0,
      externalContacts: contacts ?? 0,
    });
  } catch {
    // Tables likely don't exist yet — fail soft.
    return NextResponse.json({ profileEdges: 0, externalEdges: 0, externalContacts: 0 });
  }
}
