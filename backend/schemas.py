"""
Pydantic models — API request/response shapes.
Source of truth: docs/TEAM.md
Person 3 and 4: import from here, do NOT modify without talking to Person 2.
"""
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum


class Cadence(str, Enum):
    monthly = "monthly"
    annual = "annual"
    quarterly = "quarterly"


class UsageSignal(str, Enum):
    active = "active"
    low = "low"
    none = "none"
    unknown = "unknown"


class ActionType(str, Enum):
    cancel = "cancel"
    downgrade = "downgrade"
    negotiate = "negotiate"
    switch = "switch"


class RegretRisk(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ActionStatus(str, Enum):
    proposed = "proposed"
    approved = "approved"
    executing = "executing"
    succeeded = "succeeded"
    failed = "failed"
    rejected = "rejected"


class Channel(str, Enum):
    browser = "browser"
    email = "email"
    api = "api"
    phone = "phone"


# ─────────────────────────────────────────────
# LAYER 1 OUTPUT (Person 2 produces)
# ─────────────────────────────────────────────

class RecurringStream(BaseModel):
    id: str
    merchant: str
    raw_merchant: str
    category: str
    cadence: Cadence
    amount_usd: float
    seat_count: Optional[int]
    usage_signal: UsageSignal
    confidence: float
    is_protected: bool
    notes: Optional[str]
    first_seen: str   # ISO date
    last_seen: str    # ISO date
    occurrence_count: int

    class Config:
        from_attributes = True


class RecurringStreamsResponse(BaseModel):
    streams: List[RecurringStream]
    total_monthly_usd: float
    stream_count: int


class ConnectRequest(BaseModel):
    source: str  # 'bank' | 'gmail' | 'slack' | 'csv' | 'demo'


class ConnectResponse(BaseModel):
    connection_id: str
    streams_loaded: int


# ─────────────────────────────────────────────
# LAYER 2 OUTPUT (Person 3 produces)
# ─────────────────────────────────────────────

class Evidence(BaseModel):
    last_login_days_ago: Optional[int]
    active_seat_count: Optional[int]
    total_seat_count: Optional[int]
    duplicate_tools: Optional[List[str]]
    benchmark_price_per_seat: Optional[float]
    sources: List[str]


class Strategy(BaseModel):
    channel: Channel
    runbook_id: Optional[str]
    fallback_channel: Optional[Channel]
    email_template_id: Optional[str]


class ActionItem(BaseModel):
    recommendation_id: str
    stream_id: str
    merchant: str
    action_type: ActionType
    monthly_savings_usd: float
    annual_savings_usd: float
    confidence: float
    regret_risk: RegretRisk
    rank: int
    explanation: str
    evidence: Evidence
    strategy: Strategy
    idempotency_key: str
    require_user_confirmation: bool = True


class SkippedStream(BaseModel):
    stream_id: str
    merchant: str
    reason: str


class ActionPlan(BaseModel):
    plan_id: str
    generated_at: str
    user_goal: str
    total_monthly_savings_usd: float
    total_annual_savings_usd: float
    actions: List[ActionItem]
    skipped: List[SkippedStream]


class ConfirmRequest(BaseModel):
    recommendation_id: str
    approved_by: str


class ConfirmResponse(BaseModel):
    action_id: str


class RejectRequest(BaseModel):
    recommendation_id: str
    rejected_by: str


class RejectResponse(BaseModel):
    recommendation_id: str
    status: str


# ─────────────────────────────────────────────
# LAYER 4 OUTPUT (Person 4 produces)
# ─────────────────────────────────────────────

class ActionEvidence(BaseModel):
    type: str
    payload: dict


class ActionDetail(BaseModel):
    id: str
    recommendation_id: str
    merchant: str
    action_type: ActionType
    status: ActionStatus
    channel: Channel
    idempotency_key: str
    approved_at: Optional[str]
    executed_at: Optional[str]
    verified_at: Optional[str]
    evidence: List[ActionEvidence]
    monthly_savings_usd: float


class SavingsSummary(BaseModel):
    verified_monthly_usd: float
    pending_monthly_usd: float
    verified_annual_usd: float
    actions_succeeded: int
    actions_pending: int
    actions_failed: int


class ExecuteRequest(BaseModel):
    action_id: str


class ExecuteResponse(BaseModel):
    action_id: str
    status: ActionStatus


# Alias — avoids naming collision with ActionEvidence ORM model in routers
ActionEvidenceSchema = ActionEvidence


# ─────────────────────────────────────────────
# GET /recommendations response
# ─────────────────────────────────────────────

class RecommendationStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"
    deferred = "deferred"
    completed = "completed"


class RecommendationItem(BaseModel):
    recommendation_id: str
    stream_id: str
    merchant: str
    action_type: ActionType
    monthly_savings_usd: float
    annual_savings_usd: float
    confidence: float
    regret_risk: RegretRisk
    explanation: str
    evidence: Evidence
    status: RecommendationStatus
    created_at: str
    action_id: Optional[str] = None
    result_confirmation_id: Optional[str] = None


class RecommendationsResponse(BaseModel):
    recommendations: List[RecommendationItem]
    total_monthly_savings_usd: float
    total_annual_savings_usd: float
