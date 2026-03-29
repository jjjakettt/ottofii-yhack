from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import Recommendation, RecurringStream
from schemas import (
    RecommendationItem, RecommendationsResponse, RecommendationStatus,
    Evidence, ActionType, RegretRisk
)

router = APIRouter()

ORG_ID = "org_demo"


@router.get("/recommendations", response_model=RecommendationsResponse)
def get_recommendations(
    status: Optional[str] = Query(default="pending", description="Filter: pending | completed | all"),
    db: Session = Depends(get_db),
):
    query = db.query(Recommendation, RecurringStream).join(
        RecurringStream, Recommendation.stream_id == RecurringStream.id
    ).filter(Recommendation.org_id == ORG_ID)

    if status == "pending":
        query = query.filter(Recommendation.status == "pending")
    elif status == "completed":
        query = query.filter(Recommendation.status == "completed")
    # "all" — no additional filter

    rows = query.order_by(Recommendation.created_at.desc()).all()

    items = []
    for rec, stream in rows:
        ev_data = rec.evidence or {}
        evidence = Evidence(
            last_login_days_ago=ev_data.get("last_login_days_ago"),
            active_seat_count=ev_data.get("active_seat_count"),
            total_seat_count=ev_data.get("total_seat_count"),
            duplicate_tools=ev_data.get("duplicate_tools"),
            benchmark_price_per_seat=ev_data.get("benchmark_price_per_seat"),
            sources=ev_data.get("sources", []),
        )
        items.append(RecommendationItem(
            recommendation_id=str(rec.id),
            stream_id=str(rec.stream_id),
            merchant=str(stream.merchant),
            action_type=ActionType(str(rec.action_type)),
            monthly_savings_usd=float(rec.savings_usd or 0),
            annual_savings_usd=float(rec.savings_annual or 0),
            confidence=float(rec.confidence or 0),
            regret_risk=RegretRisk(str(rec.regret_risk)),
            explanation=str(rec.explanation or ""),
            evidence=evidence,
            status=RecommendationStatus(str(rec.status)),
            created_at=rec.created_at.isoformat() if rec.created_at else "",
        ))

    total_monthly = sum(i.monthly_savings_usd for i in items)
    total_annual = sum(i.annual_savings_usd for i in items)

    return RecommendationsResponse(
        recommendations=items,
        total_monthly_savings_usd=total_monthly,
        total_annual_savings_usd=total_annual,
    )
