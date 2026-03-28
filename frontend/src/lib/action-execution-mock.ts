import type { ActionEvidence } from "@/types";

/** Time until mock execution completes (agent “thinking” window). */
export const MOCK_EXECUTION_SUCCESS_MS = 5200;

type Overlay = {
  status: "executing" | "succeeded";
  executed_at?: string | null;
  evidence?: ActionEvidence[];
};

const overlays = new Map<string, Overlay>();

export function startMockExecution(actionId: string) {
  const existing = overlays.get(actionId);
  if (existing?.status === "succeeded" || existing?.status === "executing") {
    return;
  }

  overlays.set(actionId, { status: "executing" });

  setTimeout(() => {
    overlays.set(actionId, {
      status: "succeeded",
      executed_at: new Date().toISOString(),
      evidence: [
        {
          type: "confirmation_id",
          payload: { id: `conf_${Date.now().toString(36)}` },
        },
      ],
    });
  }, MOCK_EXECUTION_SUCCESS_MS);
}

export function getMockExecutionOverlay(actionId: string): Overlay | undefined {
  return overlays.get(actionId);
}
