import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET() {
  const { user } = await requireUser();
  const admin = getAdminSupabase();

  // Self-bootstrap: if there's no row yet, create a stub so the editor can save.
  // Lets the connection layer work even if signup flow didn't pre-create profiles.
  const { data: existing } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return NextResponse.json({ profile: existing });

  const { data: created, error } = await admin
    .from("profiles")
    .insert({
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? null,
      headline: (user.user_metadata?.headline as string) ?? null,
      roles: (user.user_metadata?.roles as string[]) ?? [],
      calendly_url: (user.user_metadata?.calendly as string) ?? null,
    })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: created });
}

export async function PATCH(request: NextRequest) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  for (const k of ["full_name", "headline", "bio", "location", "roles", "interests", "current_company", "current_title", "linkedin_url", "calendly_url", "can_intro_to"]) {
    if (k in body) allowed[k] = body[k];
  }
  allowed.updated_at = new Date().toISOString();

  const { data: updated, error } = await admin
    .from("profiles")
    .update(allowed)
    .eq("id", user.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ profile: updated });
}
