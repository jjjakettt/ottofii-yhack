import { API_BASE_URL } from "@/config/api";
import type { ActionDetail, SavingsSummary } from "@/types";

// GET /actions/{id}
export async function getAction(actionId: string): Promise<ActionDetail> {
  const res = await fetch(`${API_BASE_URL}/actions/${actionId}`);
  if (!res.ok) throw new Error(`getAction failed: ${res.status}`);
  return res.json();
}

// GET /savings/summary
export async function getSavingsSummary(): Promise<SavingsSummary> {
  const res = await fetch(`${API_BASE_URL}/savings/summary`);
  if (!res.ok) throw new Error(`getSavingsSummary failed: ${res.status}`);
  return res.json();
}
