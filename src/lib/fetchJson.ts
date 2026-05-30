// Safe JSON fetch — defends against:
//   1. 401/500 responses with an empty or non-JSON body
//   2. Network failures
// Returns: { ok, data, error, status }

export type JsonResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
};

export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<JsonResult<T>> {
  try {
    const res = await fetch(input, init);
    const text = await res.text();
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        // body wasn't JSON — keep as null
      }
    }
    const error = res.ok
      ? null
      : (data && typeof data === "object" && "error" in (data as Record<string, unknown>)
          ? String((data as Record<string, unknown>).error)
          : text || `HTTP ${res.status}`);
    return { ok: res.ok, status: res.status, data, error };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
