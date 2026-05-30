// Thin Anthropic client. We avoid the SDK to keep deps small.
// Uses Claude Sonnet 4.6 for reasoning + intro drafting.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

type Message = { role: "user" | "assistant"; content: string };

export async function claudeJSON<T>(args: {
  system: string;
  messages: Message[];
  maxTokens?: number;
}): Promise<T> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: args.maxTokens ?? 2000,
      system: args.system,
      messages: args.messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`anthropic failed: ${res.status} ${body}`);
  }

  const json = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = json.content.map((b) => b.text ?? "").join("");
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("model did not return JSON");
  return JSON.parse(match[0]) as T;
}
