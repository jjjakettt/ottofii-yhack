import type { ConnectResponse, Source } from "@/types";

// POST /connect/mock
export async function connectSource(source: Source): Promise<ConnectResponse> {
  return {
    connection_id: `conn_mock_${source}`,
    streams_loaded: source === "demo" ? 12 : 4,
  };
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
