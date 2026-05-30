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

// GET /api/profiles — all builder profiles except current user (and already-invited)
export async function GET(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  // Get IDs the current user has already sent invites to
  const { data: sent } = await supabase
    .from("match_invites")
    .select("receiver_id")
    .eq("sender_id", user.id);

  const excludeIds = [user.id, ...(sent ?? []).map((s: { receiver_id: string }) => s.receiver_id)];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "builder")
    .not("id", "in", `(${excludeIds.join(",")})`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST /api/profiles — upsert own profile from user_metadata
export async function POST(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const meta = user.user_metadata ?? {};

  const upsertData: Record<string, unknown> = {
    id: user.id,
    full_name: body.full_name ?? meta.full_name ?? user.email,
    role: body.role ?? meta.role ?? "builder",
    has_idea: body.has_idea ?? meta.has_idea ?? null,
    categories: body.categories ?? meta.categories ?? [],
    tagline: body.tagline ?? meta.tagline ?? null,
    looking_for: body.looking_for ?? meta.looking_for ?? null,
    location: body.location ?? meta.location ?? "Berlin",
    updated_at: new Date().toISOString(),
  };
  if (body.avatar_url !== undefined) upsertData.avatar_url = body.avatar_url;
  if (body.bio !== undefined) upsertData.bio = body.bio;
  if (body.education !== undefined) upsertData.education = body.education;
  if (body.linkedin_url !== undefined) upsertData.linkedin_url = body.linkedin_url;

  const { data, error } = await supabase
    .from("profiles")
    .upsert(upsertData, { onConflict: "id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
