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

// GET /api/project-applications
//   (no params)         → project_ids this user has applied to
//   ?as_owner=true      → all applications across all projects owned by this user
export async function GET(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([]);

  const asOwner = new URL(request.url).searchParams.get("as_owner") === "true";

  if (asOwner) {
    // Get all projects owned by this user, then get their applications
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("created_by", user.id);

    if (!projects?.length) return NextResponse.json([]);

    const projectIds = projects.map((p: { id: string }) => p.id);
    const { data, error } = await supabase
      .from("project_applications")
      .select("project_id, user_id, user_name, message, created_at")
      .in("project_id", projectIds)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  }

  // Default: return project_ids this user has applied to
  const { data, error } = await supabase
    .from("project_applications")
    .select("project_id")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map((r: { project_id: string }) => r.project_id));
}

// POST /api/project-applications — apply to a project
export async function POST(request: NextRequest) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { project_id, message } = await request.json();
  const user_name = user.user_metadata?.full_name ?? user.email ?? "Anonymous";

  const { error } = await supabase
    .from("project_applications")
    .upsert(
      { user_id: user.id, project_id, message: message ?? null, user_name },
      { onConflict: "user_id,project_id" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
