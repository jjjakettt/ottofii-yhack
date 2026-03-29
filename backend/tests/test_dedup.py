"""
Tests for deduplication logic in agent/validators.py
"""
import pytest
from agent.validators import deduplicate_actions
from schemas import ActionItem, Evidence, Strategy


def make_action(stream_id: str, action_type: str, monthly_savings: float, rank: int = 1) -> ActionItem:
    return ActionItem(
        recommendation_id=f"rec_{stream_id}_{action_type}",
        stream_id=stream_id,
        merchant=stream_id.replace("_", " ").title(),
        action_type=action_type,
        monthly_savings_usd=monthly_savings,
        annual_savings_usd=monthly_savings * 12,
        confidence=0.85,
        regret_risk="low",
        rank=rank,
        explanation="Test explanation.",
        evidence=Evidence(
            last_login_days_ago=None,
            active_seat_count=None,
            total_seat_count=None,
            duplicate_tools=None,
            benchmark_price_per_seat=None,
            sources=["bank"],
        ),
        strategy=Strategy(
            channel="browser",
            runbook_id=None,
            fallback_channel=None,
            email_template_id=None,
        ),
        idempotency_key=f"{action_type}_{stream_id}",
        require_user_confirmation=True,
    )


def test_duplicates_removed():
    """Two actions for same stream_id — only the higher savings one survives."""
    actions = [
        make_action("stream_001", "cancel", monthly_savings=320),
        make_action("stream_001", "downgrade", monthly_savings=150),
    ]
    result = deduplicate_actions(actions)

    assert len(result) == 1
    assert result[0].stream_id == "stream_001"
    assert result[0].action_type == "cancel"
    assert result[0].monthly_savings_usd == 320


def test_ranks_are_sequential():
    """After dedup, ranks must be sequential starting at 1 with no gaps."""
    actions = [
        make_action("stream_001", "cancel", monthly_savings=320, rank=1),
        make_action("stream_001", "downgrade", monthly_savings=150, rank=2),  # duplicate
        make_action("stream_002", "switch", monthly_savings=180, rank=3),
    ]
    result = deduplicate_actions(actions)

    assert len(result) == 2
    ranks = [a.rank for a in result]
    assert sorted(ranks) == list(range(1, len(result) + 1))


def test_no_duplicates_unchanged():
    """Three actions across three different streams — all survive, ranks 1-3."""
    actions = [
        make_action("stream_001", "cancel", monthly_savings=320, rank=1),
        make_action("stream_002", "downgrade", monthly_savings=180, rank=2),
        make_action("stream_003", "switch", monthly_savings=75, rank=3),
    ]
    result = deduplicate_actions(actions)

    assert len(result) == 3
    stream_ids = {a.stream_id for a in result}
    assert stream_ids == {"stream_001", "stream_002", "stream_003"}
    assert sorted(a.rank for a in result) == [1, 2, 3]
