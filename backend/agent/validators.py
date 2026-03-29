"""
Pure validation and scoring logic — no LLM involvement.
Called by planner.py before and after the LLM call.
"""
from schemas import ActionItem, RecurringStream

_REGRET_RISK_MAP = {
    "active": "high",
    "low": "medium",
    "none": "low",
    "unknown": "medium",
}


def _monthly_equiv(s: RecurringStream) -> float:
    if s.cadence == "annual":
        return s.amount_usd / 12
    if s.cadence == "quarterly":
        return s.amount_usd / 3
    return s.amount_usd


def pre_score(streams: list[RecurringStream]) -> tuple[list[dict], list[dict]]:
    """
    Compute deterministic scores for each stream before sending to LLM.
    Returns (scoreable, skipped) where each item is a dict ready for the prompt.
    """
    amounts = [_monthly_equiv(s) for s in streams]
    max_amount = max(amounts) if amounts else 1.0

    scoreable = []
    skipped = []

    for s, monthly_usd in zip(streams, amounts):
        if s.is_protected:
            skipped.append({
                "stream_id": s.id,
                "merchant": s.merchant,
                "reason": "Stream is protected — do not action.",
            })
            continue

        regret_risk = _REGRET_RISK_MAP.get(s.usage_signal, "medium")
        savings_score = round(monthly_usd / max_amount, 3)

        scoreable.append({
            "stream_id": s.id,
            "merchant": s.merchant,
            "category": s.category,
            "cadence": s.cadence,
            "amount_usd": s.amount_usd,
            "monthly_equivalent_usd": round(monthly_usd, 2),
            "seat_count": s.seat_count,
            "usage_signal": s.usage_signal,
            "confidence": s.confidence,
            "regret_risk_hint": regret_risk,
            "savings_score": savings_score,
            "notes": s.notes,
            "first_seen": s.first_seen,
            "last_seen": s.last_seen,
            "occurrence_count": s.occurrence_count,
        })

    return scoreable, skipped


def deduplicate_actions(actions: list[ActionItem]) -> list[ActionItem]:
    """
    Enforce one action per stream_id, keeping the highest monthly_savings_usd.
    Re-ranks surviving actions sequentially by savings descending.
    """
    seen: dict[str, ActionItem] = {}
    for action in actions:
        existing = seen.get(action.stream_id)
        if not existing or action.monthly_savings_usd > existing.monthly_savings_usd:
            seen[action.stream_id] = action

    deduped = sorted(seen.values(), key=lambda a: a.monthly_savings_usd, reverse=True)
    for i, action in enumerate(deduped, start=1):
        action.rank = i

    return deduped
