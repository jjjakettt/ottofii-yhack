import type { ActionDetail, SavingsSummary } from "@/types";

// Notion cancel, status: approved
export const mockActionDetail: ActionDetail = {
  id: "act_f9e866f09fbd",
  recommendation_id: "rec_da7d77af-90e9-48c7-9478-fa0d8a9485a3",
  merchant: "Notion",
  action_type: "cancel",
  status: "approved",
  channel: "browser",
  idempotency_key: "cancel_stream_001",
  approved_at: "2026-03-28T21:04:28.355181+00:00",
  executed_at: null,
  verified_at: null,
  evidence: [],
  monthly_savings_usd: 320.0,
};

// Savings summary for Notion cancel, status: approved
export const mockSavingsSummary: SavingsSummary = {
  verified_monthly_usd: 0,
  pending_monthly_usd: 320.0,
  verified_annual_usd: 0,
  actions_succeeded: 0,
  actions_pending: 1,
  actions_failed: 0,
};
