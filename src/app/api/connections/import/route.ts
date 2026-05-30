import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";
import { parseLinkedInConnections } from "@/lib/csv";

export const runtime = "nodejs";

// POST /api/connections/import
// Body: multipart/form-data with field "file" containing LinkedIn Connections.csv
// Effect: creates external_contacts + connections owned by the current user.
//         If an existing Scout profile matches (by linkedin_url or email),
//         creates a profile->profile edge instead of an external one.

export async function POST(request: NextRequest) {
  const { user } = await requireUser();
  const admin = getAdminSupabase();

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file missing" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseLinkedInConnections(text);
  if (rows.length === 0) {
    return NextResponse.json({ error: "no rows parsed" }, { status: 400 });
  }

  // Pre-load every Scout profile we might match against. For a small user
  // base this is fine; later we'd batch via per-row lookups.
  const { data: scoutProfiles } = await admin
    .from("profiles")
    .select("id, linkedin_url");
  const byLinkedIn = new Map<string, string>();
  for (const p of scoutProfiles ?? []) {
    if (p.linkedin_url) byLinkedIn.set(normalizeUrl(p.linkedin_url), p.id);
  }

  const externalRows: Array<Record<string, unknown>> = [];
  const profileEdges: Array<Record<string, unknown>> = [];

  for (const row of rows) {
    const full_name = [row["First Name"], row["Last Name"]].filter(Boolean).join(" ").trim();
    if (!full_name) continue;
    const url = row["URL"] || row["Profile URL"] || null;
    const company = row["Company"] || null;
    const title = row["Position"] || null;
    const email = row["Email Address"] || null;

    const matchedId = url ? byLinkedIn.get(normalizeUrl(url)) : undefined;
    if (matchedId && matchedId !== user.id) {
      profileEdges.push({
        from_profile_id: user.id,
        to_profile_id: matchedId,
        tie_strength: 0.3,
        source: "linkedin_csv",
        context: company ? `LinkedIn — ${title ?? "contact"} at ${company}` : "LinkedIn",
      });
    } else {
      externalRows.push({
        owner_id: user.id,
        full_name,
        email,
        linkedin_url: url,
        company,
        title,
        source: "linkedin_csv",
      });
    }
  }

  let externalInserted = 0;
  if (externalRows.length) {
    const { data: ext, error } = await admin
      .from("external_contacts")
      .insert(externalRows)
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    externalInserted = ext?.length ?? 0;

    const externalEdges = (ext ?? []).map((e) => ({
      from_profile_id: user.id,
      to_external_id: e.id,
      tie_strength: 0.3,
      source: "linkedin_csv",
    }));
    if (externalEdges.length) {
      const { error: e2 } = await admin
        .from("connections")
        .upsert(externalEdges, { onConflict: "from_profile_id,to_external_id" });
      if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    }
  }

  if (profileEdges.length) {
    const { error: e3 } = await admin
      .from("connections")
      .upsert(profileEdges, { onConflict: "from_profile_id,to_profile_id" });
    if (e3) return NextResponse.json({ error: e3.message }, { status: 500 });
  }

  return NextResponse.json({
    parsed: rows.length,
    externalContacts: externalInserted,
    profileEdges: profileEdges.length,
  });
}

function normalizeUrl(u: string): string {
  return u.trim().replace(/\/+$/, "").toLowerCase();
}
