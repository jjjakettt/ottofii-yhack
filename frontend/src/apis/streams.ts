import { API_BASE_URL } from "@/config/api";
import type { RecurringStreamsResponse } from "@/types";

// GET /recurring-streams
export async function getRecurringStreams(): Promise<RecurringStreamsResponse> {
  const res = await fetch(`${API_BASE_URL}/recurring-streams`);
  if (!res.ok) throw new Error(`GET /recurring-streams failed: ${res.status}`);
  return res.json();
}
