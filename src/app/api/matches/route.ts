import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

// GET /api/matches — all accepted matches for current user, with partner profile
export async function GET() {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const { data: matchRows, error } = await supabase
    .from("matches")
    .select("id, user_id_1, user_id_2, created_at")
    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!matchRows?.length) return NextResponse.json([]);

  const partnerIds = matchRows.map((m: { user_id_1: string; user_id_2: string }) =>
    m.user_id_1 === user.id ? m.user_id_2 : m.user_id_1
  );

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("id", partnerIds);

  const profileMap = Object.fromEntries((profiles ?? []).map((p: { id: string }) => [p.id, p]));

  return NextResponse.json(matchRows.map((m: { id: string; user_id_1: string; user_id_2: string; created_at: string }) => {
    const partnerId = m.user_id_1 === user.id ? m.user_id_2 : m.user_id_1;
    return { ...m, partner: profileMap[partnerId] ?? null };
  }));
}
