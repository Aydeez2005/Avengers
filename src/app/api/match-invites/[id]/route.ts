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

// PUT /api/match-invites/[id] — accept or decline an invite
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = makeClient(await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { status } = await request.json();

  // Update invite status (RLS ensures only receiver can do this)
  const { data: invite, error: updateError } = await supabase
    .from("match_invites")
    .update({ status })
    .eq("id", id)
    .eq("receiver_id", user.id)
    .select()
    .single();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // If accepted, create the match
  if (status === "accepted" && invite) {
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .upsert(
        { user_id_1: invite.sender_id, user_id_2: invite.receiver_id },
        { onConflict: "user_id_1,user_id_2" }
      )
      .select()
      .single();

    if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 });
    return NextResponse.json({ invite, match });
  }

  return NextResponse.json({ invite });
}
