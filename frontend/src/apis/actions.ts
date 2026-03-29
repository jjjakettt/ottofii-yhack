import type { ActionDetail, SavingsSummary } from "@/types";

import { API_BASE_URL } from "@/config/api";

// GET /actions/{id}
export async function getAction(actionId: string): Promise<ActionDetail> {
  const res = await fetch(`${API_BASE_URL}/actions/${actionId}`);
  if (!res.ok) throw new Error(`GET /actions/${actionId} failed: ${res.status}`);
  return res.json();
}

// GET /savings/summary
export async function getSavingsSummary(): Promise<SavingsSummary> {
  const res = await fetch(`${API_BASE_URL}/savings/summary`);
  if (!res.ok) throw new Error(`GET /savings/summary failed: ${res.status}`);
  return res.json();
}
