export type Cadence = "monthly" | "annual" | "quarterly";
export type UsageSignal = "active" | "low" | "none" | "unknown";
export type ActionType = "cancel" | "downgrade" | "negotiate" | "switch";
export type RegretRisk = "low" | "medium" | "high";
export type ActionStatus = "proposed" | "approved" | "executing" | "succeeded" | "failed" | "rejected";
export type Channel = "browser" | "email" | "api";
export type Source = "bank" | "gmail" | "slack" | "csv" | "demo";

// Recurring Stream
export interface RecurringStream {
  id: string;
  merchant: string;
  raw_merchant: string;
  category: string;
  cadence: Cadence;
  amount_usd: number;
  seat_count: number | null;
  usage_signal: UsageSignal;
  confidence: number;
  is_protected: boolean;
  notes: string | null;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
}

// Recurring Streams Response
export interface RecurringStreamsResponse {
  streams: RecurringStream[];
  total_monthly_usd: number;
  stream_count: number;
}

// Evidence
export interface Evidence {
  last_login_days_ago: number | null;
  active_seat_count: number | null;
  total_seat_count: number | null;
  duplicate_tools: string[] | null;
  benchmark_price_per_seat: number | null;
  sources: string[];
}

// Strategy
export interface Strategy {
  channel: Channel;
  runbook_id: string | null;
  fallback_channel: Channel | null;
  email_template_id: string | null;
}

// Action Item
export interface ActionItem {
  recommendation_id: string;
  stream_id: string;
  merchant: string;
  action_type: ActionType;
  monthly_savings_usd: number;
  annual_savings_usd: number;
  confidence: number;
  regret_risk: RegretRisk;
  rank: number;
  explanation: string;
  evidence: Evidence;
  strategy: Strategy;
  idempotency_key: string;
  require_user_confirmation: boolean;
}

// Skipped Stream
export interface SkippedStream {
  stream_id: string;
  merchant: string;
  reason: string;
}

// Action Plan
export interface ActionPlan {
  plan_id: string;
  generated_at: string;
  user_goal: string;
  total_monthly_savings_usd: number;
  total_annual_savings_usd: number;
  actions: ActionItem[];
  skipped: SkippedStream[];
}

// Action Evidence
export interface ActionEvidence {
  type: "screenshot" | "confirmation_id" | "email";
  payload: Record<string, string>;
}

// Action Detail
export interface ActionDetail {
  id: string;
  recommendation_id: string;
  merchant: string;
  action_type: ActionType;
  status: ActionStatus;
  channel: Channel;
  idempotency_key: string;
  approved_at: string | null;
  executed_at: string | null;
  verified_at: string | null;
  evidence: ActionEvidence[];
  monthly_savings_usd: number;
}

// Savings Summary
export interface SavingsSummary {
  verified_monthly_usd: number;
  pending_monthly_usd: number;
  verified_annual_usd: number;
  actions_succeeded: number;
  actions_pending: number;
  actions_failed: number;
}

// Recommendation Item (from GET /recommendations)
export type RecommendationStatus = "pending" | "approved" | "rejected" | "deferred" | "completed";

export interface RecommendationItem {
  recommendation_id: string;
  stream_id: string;
  merchant: string;
  action_type: ActionType;
  monthly_savings_usd: number;
  annual_savings_usd: number;
  confidence: number;
  regret_risk: RegretRisk;
  explanation: string;
  evidence: Evidence;
  status: RecommendationStatus;
  created_at: string;
}

export interface RecommendationsResponse {
  recommendations: RecommendationItem[];
  total_monthly_savings_usd: number;
  total_annual_savings_usd: number;
}

// Connect Response
export interface ConnectResponse {
  connection_id: string;
  streams_loaded: number;
}

// Confirm Response
export interface ConfirmResponse {
  action_id: string;
}

// Reject Response
export interface RejectResponse {
  recommendation_id: string;
  status: string;
}

// Execute Response
export interface ExecuteResponse {
  action_id: string;
  status: ActionStatus;
}
