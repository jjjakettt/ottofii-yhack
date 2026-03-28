import type { ActionDetail, SavingsSummary } from "@/types";
import { mockActionDetail, mockSavingsSummary } from "@/data/actions";
import { mockActionPlan } from "@/data/plan";
import { getMockExecutionOverlay } from "@/lib/action-execution-mock";


function parseRecommendationIdFromActionId(actionId: string): string | null {
  if (!actionId.startsWith("act_")) return null;
  const rest = actionId.slice(4);
  const lastUnderscore = rest.lastIndexOf("_");
  if (lastUnderscore === -1) return null;
  const suffix = rest.slice(lastUnderscore + 1);
  if (!/^\d+$/.test(suffix)) return null;
  return rest.slice(0, lastUnderscore);
}

function actionDetailFromPlanItem(
  actionId: string,
  recommendationId: string
): ActionDetail | null {
  const item = mockActionPlan.actions.find(
    (a) => a.recommendation_id === recommendationId
  );
  if (!item) return null;
  return {
    id: actionId,
    recommendation_id: item.recommendation_id,
    merchant: item.merchant,
    action_type: item.action_type,
    status: "approved",
    channel: item.strategy.channel,
    idempotency_key: item.idempotency_key,
    approved_at: mockActionPlan.generated_at,
    executed_at: null,
    verified_at: null,
    evidence: [],
    monthly_savings_usd: item.monthly_savings_usd,
  };
}

function mergeExecutionOverlay(base: ActionDetail, actionId: string): ActionDetail {
  const overlay = getMockExecutionOverlay(actionId);
  if (!overlay) return base;
  return {
    ...base,
    status: overlay.status,
    executed_at: overlay.executed_at ?? base.executed_at,
    evidence:
      overlay.evidence && overlay.evidence.length > 0
        ? overlay.evidence
        : base.evidence,
  };
}

// GET /actions/{id}
export async function getAction(actionId: string): Promise<ActionDetail> {
  const recommendationId = parseRecommendationIdFromActionId(actionId);
  let base: ActionDetail;
  if (recommendationId) {
    const fromPlan = actionDetailFromPlanItem(actionId, recommendationId);
    base = fromPlan ?? { ...mockActionDetail, id: actionId };
  } else {
    base = { ...mockActionDetail, id: actionId };
  }
  return mergeExecutionOverlay(base, actionId);
}

// GET /savings/summary
export async function getSavingsSummary(): Promise<SavingsSummary> {
  return mockSavingsSummary;
}
