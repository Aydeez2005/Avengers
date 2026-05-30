import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

function makeClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    }
  );
}

// GET /api/event-registrations
//   (no params)         → event_ids this user has registered for
//   ?as_owner=true      → all registrations across all events created by this user
export async function GET(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const asOwner = new URL(request.url).searchParams.get("as_owner") === "true";

  if (asOwner) {
    // Get all events created by this user, then get their registrations
    const { data: events } = await supabase
      .from("events")
      .select("id")
      .eq("created_by", user.id);

    if (!events?.length) return NextResponse.json([]);

    const eventIds = events.map((e: { id: string }) => e.id);
    const { data, error } = await supabase
      .from("event_registrations")
      .select("event_id, user_id, user_name, created_at")
      .in("event_id", eventIds)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // Default: return event_ids this user has registered for
  const { data, error } = await supabase
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: { event_id: string }) => r.event_id));
}

// POST /api/event-registrations — register for an event
export async function POST(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event_id } = await request.json();
  const user_name = user.user_metadata?.full_name ?? user.email ?? "Anonymous";

  const { error } = await supabase
    .from("event_registrations")
    .upsert({ user_id: user.id, event_id, user_name }, { onConflict: "user_id,event_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/event-registrations — unregister from an event
export async function DELETE(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { event_id } = await request.json();
  const { error } = await supabase
    .from("event_registrations")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", event_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
