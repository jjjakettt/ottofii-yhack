import { API_BASE_URL } from "@/config/api";
import type { ActionPlan, ConfirmResponse, RejectResponse, ExecuteResponse, RecommendationsResponse } from "@/types";

// POST /agent/plan
export async function getActionPlan(userGoal = "Reduce my monthly spend"): Promise<ActionPlan> {
  const res = await fetch(`${API_BASE_URL}/agent/plan`, {
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
  const res = await fetch(`${API_BASE_URL}/agent/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recommendation_id: recommendationId, approved_by: approvedBy }),
  });
  if (!res.ok) throw new Error(`POST /agent/confirm failed: ${res.status}`);
  return res.json();
}

// POST /agent/restore
export async function restoreRecommendation(recommendationId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/agent/restore`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recommendation_id: recommendationId, rejected_by: "user_demo" }),
  });
  if (!res.ok) throw new Error(`POST /agent/restore failed: ${res.status}`);
}

// POST /agent/reject
export async function rejectAction(
  recommendationId: string,
  rejectedBy = "user_demo"
): Promise<RejectResponse> {
  const res = await fetch(`${API_BASE_URL}/agent/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recommendation_id: recommendationId, rejected_by: rejectedBy }),
  });
  if (!res.ok) throw new Error(`POST /agent/reject failed: ${res.status}`);
  return res.json();
}

// GET /recommendations?status=pending|completed|all
export async function getRecommendations(status = "pending"): Promise<RecommendationsResponse> {
  const res = await fetch(`${API_BASE_URL}/recommendations?status=${status}`);
  if (!res.ok) throw new Error(`GET /recommendations failed: ${res.status}`);
  return res.json();
}

// POST /agent/execute
export async function executeAction(actionId: string): Promise<ExecuteResponse> {
  const res = await fetch(`${API_BASE_URL}/agent/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action_id: actionId }),
  });
  if (!res.ok) throw new Error(`POST /agent/execute failed: ${res.status}`);
  return res.json();
}

// POST /actions/{action_id}/retry
export async function retryAction(actionId: string): Promise<ExecuteResponse> {
  const res = await fetch(`${API_BASE_URL}/actions/${actionId}/retry`, {
    method: "POST",
  });
  if (!res.ok) throw new Error(`POST /actions/${actionId}/retry failed: ${res.status}`);
  return res.json();
}
