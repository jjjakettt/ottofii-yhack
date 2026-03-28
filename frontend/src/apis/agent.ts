import type { ActionPlan, ConfirmResponse, ExecuteResponse } from "@/types";
import { mockActionPlan } from "@/data/plan";

// POST /agent/plan
export async function getActionPlan(userGoal = "Reduce my monthly spend"): Promise<ActionPlan> {
  void userGoal;
  return mockActionPlan;
}

// POST /agent/confirm
export async function confirmAction(
  recommendationId: string,
  approvedBy = "user_demo"
): Promise<ConfirmResponse> {
  void approvedBy;
  return { action_id: `act_${recommendationId}_${Date.now()}` };
}

// POST /agent/execute
export async function executeAction(actionId: string): Promise<ExecuteResponse> {
  return { action_id: actionId, status: "executing" };
}
