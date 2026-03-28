import type { RecurringStreamsResponse } from "@/types";
import { mockStreamsResponse } from "@/data/streams";

// GET /recurring-streams
export async function getRecurringStreams(): Promise<RecurringStreamsResponse> {
  return mockStreamsResponse;
}
