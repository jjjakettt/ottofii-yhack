import type { ConnectResponse, Source } from "@/types";

// POST /connect/mock
export async function connectSource(source: Source): Promise<ConnectResponse> {
  return {
    connection_id: `conn_mock_${source}`,
    streams_loaded: source === "demo" ? 12 : 4,
  };
}
