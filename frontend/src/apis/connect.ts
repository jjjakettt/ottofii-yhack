import { API_BASE_URL } from "@/config/api";
import type { ConnectResponse, Source } from "@/types";

// POST /connect/mock
export async function connectSource(source: Source): Promise<ConnectResponse> {
  const res = await fetch(`${API_BASE_URL}/connect/mock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source }),
  });
  if (!res.ok) throw new Error(`connectSource failed: ${res.status}`);
  return res.json();
}

export async function connectSources(sources: Source[]): Promise<ConnectResponse> {
  if (sources.length === 0) {
    return { connection_id: "", streams_loaded: 0 };
  }
  const results = await Promise.all(sources.map((s) => connectSource(s)));
  return {
    connection_id: results.map((r) => r.connection_id).join(","),
    streams_loaded: results.reduce((sum, r) => sum + r.streams_loaded, 0),
  };
}
