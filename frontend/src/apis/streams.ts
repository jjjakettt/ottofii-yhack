import type { RecurringStreamsResponse } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// GET /recurring-streams
export async function getRecurringStreams(): Promise<RecurringStreamsResponse> {
  const res = await fetch(`${API}/recurring-streams`);
  if (!res.ok) throw new Error(`GET /recurring-streams failed: ${res.status}`);
  return res.json();
}
