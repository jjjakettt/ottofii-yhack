import type { ActionPlan, ConfirmResponse, ExecuteResponse, RecommendationsResponse } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// POST /agent/plan
export async function getActionPlan(userGoal = "Reduce my monthly spend"): Promise<ActionPlan> {
  const res = await fetch(`${API}/agent/plan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_goal: userGoal }),
  });
  if (!res.ok) throw new Error(`POST /agent/plan failed: ${res.status}`);
  return res.json();
}

// POST /agent/confirm
export async function confirmAction(
  recommendationId: string,
  approvedBy = "user_demo"
): Promise<ConfirmResponse> {
  const res = await fetch(`${API}/agent/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recommendation_id: recommendationId, approved_by: approvedBy }),
  });
  if (!res.ok) throw new Error(`POST /agent/confirm failed: ${res.status}`);
  return res.json();
}

// GET /recommendations?status=pending|completed|all
export async function getRecommendations(status = "pending"): Promise<RecommendationsResponse> {
  const res = await fetch(`${API}/recommendations?status=${status}`);
  if (!res.ok) throw new Error(`GET /recommendations failed: ${res.status}`);
  return res.json();
}

// POST /agent/execute
export async function executeAction(actionId: string): Promise<ExecuteResponse> {
  const res = await fetch(`${API}/agent/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action_id: actionId }),
  });
  if (!res.ok) throw new Error(`POST /agent/execute failed: ${res.status}`);
  return res.json();
}
