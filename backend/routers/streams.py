"""
GET /recurring-streams
Owner: Person 2
Called by: Person 1 (dashboard), Person 3 (agent plan)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import RecurringStream as RecurringStreamModel
from schemas import RecurringStream, RecurringStreamsResponse

router = APIRouter()


@router.get("/recurring-streams", response_model=RecurringStreamsResponse)
def get_recurring_streams(db: Session = Depends(get_db)):
    rows = db.query(RecurringStreamModel).filter(
        RecurringStreamModel.org_id == "org_demo"
    ).all()

    streams = []
    for row in rows:
        streams.append(RecurringStream(
            id=row.id,
            merchant=row.merchant,
            raw_merchant=row.raw_merchant or row.merchant,
            category=row.category,
            cadence=row.cadence,
            amount_usd=float(row.amount_usd),
            seat_count=row.seat_count,
            usage_signal=row.usage_signal,
            confidence=float(row.confidence),
            is_protected=row.is_protected,
            notes=row.notes,
            first_seen=str(row.first_seen),
            last_seen=str(row.last_seen),
            occurrence_count=row.occurrence_count,
        ))

    # Only sum monthly streams for total_monthly_usd
    # Annual streams are divided by 12 to get monthly equivalent
    total_monthly = 0.0
    for s in streams:
        if s.cadence == "monthly" or s.cadence == "quarterly":
            total_monthly += s.amount_usd
        elif s.cadence == "annual":
            total_monthly += s.amount_usd / 12.0

    return RecurringStreamsResponse(
        streams=streams,
        total_monthly_usd=round(total_monthly, 2),
        stream_count=len(streams),
    )
