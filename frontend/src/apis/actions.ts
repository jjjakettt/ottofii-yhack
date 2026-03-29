import type { ActionDetail, SavingsSummary } from "@/types";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// GET /actions/{id}
export async function getAction(actionId: string): Promise<ActionDetail> {
  const res = await fetch(`${API}/actions/${actionId}`);
  if (!res.ok) throw new Error(`GET /actions/${actionId} failed: ${res.status}`);
  return res.json();
}

// GET /savings/summary
export async function getSavingsSummary(): Promise<SavingsSummary> {
  const res = await fetch(`${API}/savings/summary`);
  if (!res.ok) throw new Error(`GET /savings/summary failed: ${res.status}`);
  return res.json();
}
