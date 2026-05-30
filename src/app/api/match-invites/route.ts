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

// GET /api/match-invites — pending invites received by current user, with sender profile
export async function GET() {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data: invites, error } = await supabase
    .from("match_invites")
    .select("id, sender_id, created_at, status")
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!invites?.length) return NextResponse.json([]);

  const senderIds = invites.map((i: { sender_id: string }) => i.sender_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", senderIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));

  return NextResponse.json(invites.map((inv: { id: string; sender_id: string; created_at: string; status: string }) => ({
    ...inv,
    sender: profileMap[inv.sender_id] ?? null,
  })));
}

// POST /api/match-invites — send an invite
export async function POST(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiver_id } = await request.json();
  const { data, error } = await supabase
    .from("match_invites")
    .upsert({ sender_id: user.id, receiver_id }, { onConflict: "sender_id,receiver_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
