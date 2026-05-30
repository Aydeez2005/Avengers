import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase, requireUser } from "@/lib/supabase-server";
import { claudeJSON } from "@/lib/agent";

export const runtime = "nodejs";

// POST /api/intros/suggest
// Body: { goal: string, save?: boolean }
//
// The agent:
//   1. Embeds the goal text.
//   2. Vector-search finds the most relevant profiles.
//   3. For each candidate, checks 2-hop paths: who in MY graph knows this person?
//   4. Ranks by (relevance × tie_strength × candidate_responsiveness).
//   5. Asks Claude to pick top 3 and draft per-intro messages the bridge can forward.
//   6. Optionally persists suggestions as `intros` rows with status='suggested'.

type Candidate = {
  targetId: string;
  targetName: string | null;
  targetHeadline: string | null;
  similarity: number;
  bridgeId: string;
  bridgeName: string | null;
  tieStrength: number;
};

type AgentPick = {
  bridgeId: string;
  targetId: string;
  reason: string;       // shown to requester: why this is a good match
  draftMessage: string; // shown to bridge: a draftable intro paragraph
  score: number;        // 0..1
};

export async function POST(request: NextRequest) {
  let userId: string;
  try {
    const { user } = await requireUser();
    userId = user.id;
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }
  const admin = getAdminSupabase();

  const body = await request.json().catch(() => null);
  const goal = body?.goal as string | undefined;
  const save = Boolean(body?.save);
  if (!goal || goal.trim().length < 5) {
    return NextResponse.json({ error: "goal required (min 5 chars)" }, { status: 400 });
  }

  // Wrap everything DB- or model-dependent. Demo mode = no Supabase schema
  // and/or no Anthropic key → return an empty suggestion list with a note,
  // never a 500.
  try {
    // Requester profile (for the agent's context).
    const { data: me, error: meErr } = await admin
      .from("profiles")
      .select("id, full_name, headline, bio, interests, current_company, current_title, location")
      .eq("id", userId)
      .single();
    if (meErr) throw meErr;
    if (!me) {
      return NextResponse.json({
        suggestions: [],
        note: "Finish your profile so Scout knows what you're looking for.",
      });
    }
    return await runSuggester(admin, userId, me, goal, save);
  } catch (e) {
    console.error("suggest failed", e);
    return NextResponse.json({
      suggestions: [],
      note:
        "Connection layer not ready yet — apply the SQL migrations, or import some contacts to see real suggestions.",
    });
  }
}

async function runSuggester(
  admin: ReturnType<typeof getAdminSupabase>,
  userId: string,
  me: Record<string, unknown>,
  goal: string,
  save: boolean,
) {

  // Step 1+2: lexical full-text match against profile search vectors.
  const { data: matches, error: matchErr } = await admin.rpc("match_profiles", {
    goal_text: goal,
    exclude_id: userId,
    match_count: 50,
  });
  if (matchErr) return NextResponse.json({ error: matchErr.message }, { status: 500 });

  const matchIds: string[] = (matches ?? []).map((m: { id: string }) => m.id);
  if (matchIds.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Step 3: who in MY graph knows any of these candidates?
  // First, my direct connections (potential bridges).
  const { data: myEdges } = await admin
    .from("connections")
    .select("to_profile_id, tie_strength")
    .eq("from_profile_id", userId)
    .not("to_profile_id", "is", null);
  const myFriends = new Map<string, number>(
    (myEdges ?? []).map((e) => [e.to_profile_id as string, e.tie_strength as number])
  );
  if (myFriends.size === 0) {
    return NextResponse.json({ suggestions: [], note: "no graph yet — import LinkedIn or add connections" });
  }

  // Bridge -> candidate edges where bridge is in myFriends and candidate is in matchIds.
  const { data: bridgeEdges } = await admin
    .from("connections")
    .select("from_profile_id, to_profile_id")
    .in("from_profile_id", Array.from(myFriends.keys()))
    .in("to_profile_id", matchIds);

  if (!bridgeEdges?.length) {
    return NextResponse.json({ suggestions: [], note: "no 2-hop paths to relevant people yet" });
  }

  // Hydrate names for bridges and targets.
  const allIds = new Set<string>();
  for (const e of bridgeEdges) {
    allIds.add(e.from_profile_id as string);
    allIds.add(e.to_profile_id as string);
  }
  const { data: people } = await admin
    .from("profiles")
    .select("id, full_name, headline")
    .in("id", Array.from(allIds));
  const byId = new Map((people ?? []).map((p) => [p.id, p]));
  const simById = new Map<string, number>(
    (matches ?? []).map((m: { id: string; similarity: number }) => [m.id, m.similarity])
  );

  const candidates: Candidate[] = bridgeEdges.map((e) => {
    const bridgeId = e.from_profile_id as string;
    const targetId = e.to_profile_id as string;
    return {
      targetId,
      targetName: byId.get(targetId)?.full_name ?? null,
      targetHeadline: byId.get(targetId)?.headline ?? null,
      similarity: simById.get(targetId) ?? 0,
      bridgeId,
      bridgeName: byId.get(bridgeId)?.full_name ?? null,
      tieStrength: myFriends.get(bridgeId) ?? 0.3,
    };
  });

  // Step 4: pre-rank, keep top 10 for the agent to reason over.
  candidates.sort(
    (a, b) =>
      b.similarity * b.tieStrength - a.similarity * a.tieStrength
  );
  const shortlist = candidates.slice(0, 10);

  // Step 5: agent picks + drafts.
  const agentResult = await claudeJSON<{ picks: AgentPick[] }>({
    system: AGENT_SYSTEM,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          requester: me,
          goal,
          candidates: shortlist.map((c) => ({
            bridgeId: c.bridgeId,
            bridgeName: c.bridgeName,
            targetId: c.targetId,
            targetName: c.targetName,
            targetHeadline: c.targetHeadline,
            similarity: Number(c.similarity.toFixed(3)),
            tieStrength: Number(c.tieStrength.toFixed(3)),
          })),
        }),
      },
    ],
    maxTokens: 2500,
  });

  // Step 6: optionally persist as suggestions.
  if (save && agentResult.picks?.length) {
    await admin.from("intros").insert(
      agentResult.picks.map((p) => ({
        requester_id: userId,
        bridge_id: p.bridgeId,
        target_profile_id: p.targetId,
        goal,
        context: p.reason,
        draft_message: p.draftMessage,
        relevance_score: p.score,
        status: "suggested",
      }))
    );
  }

  // Hydrate names for the UI.
  const hydrated = (agentResult.picks ?? []).map((p) => ({
    ...p,
    bridgeName: byId.get(p.bridgeId)?.full_name ?? null,
    targetName: byId.get(p.targetId)?.full_name ?? null,
    targetHeadline: byId.get(p.targetId)?.headline ?? null,
  }));

  return NextResponse.json({ suggestions: hydrated });
}

const AGENT_SYSTEM = `You are Scout's intro-matching agent. You help a member ("requester") find the best path through their existing connections to someone they want to meet, given a stated goal.

Input is JSON with: requester profile, goal text, and a candidates array. Each candidate is a (bridge, target) pair — the bridge is someone the requester already knows; the target is someone the bridge knows.

Pick AT MOST 3 candidates that best match the goal. For each pick, output:
- bridgeId, targetId (verbatim from input)
- reason: 1–2 sentences explaining to the requester why this intro is worth asking for. Specific, not generic ("Kelly founded a BCI startup that ships consumer devices" — not "good fit for your interests")
- draftMessage: a 2–4 sentence intro the BRIDGE can paste when forwarding. Written FROM the bridge TO the target. Warm but concise. No emojis. No "I hope this email finds you well".
- score: 0..1, your overall confidence

Tradeoffs to consider: stronger ties are more likely to actually make the intro; but a weak tie to a perfect-fit target can still beat a strong tie to a weak match. Don't suggest intros that feel forced.

If none of the candidates are a real fit, return picks: [].

Return STRICT JSON of the form: {"picks":[{...}]}`;
