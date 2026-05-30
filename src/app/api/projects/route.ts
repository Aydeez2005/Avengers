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

export async function GET(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const mine = new URL(request.url).searchParams.get("mine") === "true";
  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (mine) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([]);
    query = query.eq("created_by", user.id);
  }
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { data, error } = await supabase.from("projects").insert({
    created_by: user.id,
    name: body.name,
    description: body.description,
    deadline: body.deadline || null,
    budget: body.budget ? Number(body.budget) : null,
    people_required: body.people ? Number(body.people) : 1,
    website: body.website ?? null,
    tags: Array.isArray(body.tags) ? body.tags : [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
