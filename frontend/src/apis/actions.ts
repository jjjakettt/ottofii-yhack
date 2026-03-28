import type { ActionDetail, SavingsSummary } from "@/types";
import { mockActionDetail, mockSavingsSummary } from "@/data/actions";

// GET /actions/{id}
export async function getAction(actionId: string): Promise<ActionDetail> {
  void actionId;
  return mockActionDetail;
}

// GET /savings/summary
export async function getSavingsSummary(): Promise<SavingsSummary> {
  return mockSavingsSummary;
}
