"""
POST /agent/execute
GET  /actions/{id}
GET  /savings/summary
Owner: Person 4 (DB queries by Person 2)
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Action, ActionEvidence, Recommendation
from schemas import ActionDetail, ActionEvidence as ActionEvidenceSchema, SavingsSummary

router = APIRouter()

ORG_ID = "org_demo"


class ExecuteRequest(BaseModel):
    action_id: str


class ExecuteResponse(BaseModel):
    action_id: str
    status: str


@router.post("/agent/execute", response_model=ExecuteResponse)
def execute_action(body: ExecuteRequest, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == body.action_id).first()

    if not action:
        raise HTTPException(status_code=404, detail="action_id not found")

    if action.status != "approved":
        raise HTTPException(status_code=409, detail=f"Action is already {action.status}")

    now = datetime.now(timezone.utc)

    action.status = "executing"
    action.executed_at = now
    db.commit()

    # Write fake evidence (confirmation ID)
    confirmation_id = f"CONF-{uuid.uuid4().hex[:8].upper()}"
    evidence = ActionEvidence(
        id=f"ev_{uuid.uuid4().hex[:12]}",
        action_id=action.id,
        type="confirmation_id",
        payload={"id": confirmation_id},
    )
    db.add(evidence)

    action.status = "succeeded"
    action.verified_at = now
    db.commit()

    return ExecuteResponse(action_id=action.id, status="executing")


@router.get("/actions/{action_id}", response_model=ActionDetail)
def get_action(action_id: str, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()

    if not action:
        raise HTTPException(status_code=404, detail="action_id not found")

    rec = db.query(Recommendation).filter(Recommendation.id == action.recommendation_id).first()
    evidence_rows = db.query(ActionEvidence).filter(ActionEvidence.action_id == action_id).all()

    return ActionDetail(
        id=action.id,
        recommendation_id=action.recommendation_id,
        merchant=rec.stream_id if rec else "",
        action_type=rec.action_type if rec else "cancel",
        status=action.status,
        channel=action.channel,
        idempotency_key=action.idempotency_key,
        approved_at=action.approved_at.isoformat() if action.approved_at else None,
        executed_at=action.executed_at.isoformat() if action.executed_at else None,
        verified_at=action.verified_at.isoformat() if action.verified_at else None,
        evidence=[ActionEvidenceSchema(type=e.type, payload=e.payload) for e in evidence_rows],
        monthly_savings_usd=float(rec.savings_usd) if rec else 0.0,
    )


@router.get("/savings/summary", response_model=SavingsSummary)
def savings_summary(db: Session = Depends(get_db)):
    actions = db.query(Action).filter(Action.org_id == ORG_ID).all()

    verified_monthly = 0.0
    pending_monthly = 0.0
    succeeded = 0
    pending = 0
    failed = 0

    for action in actions:
        rec = db.query(Recommendation).filter(
            Recommendation.id == action.recommendation_id
        ).first()
        savings = float(rec.savings_usd) if rec else 0.0

        if action.status == "succeeded":
            verified_monthly += savings
            succeeded += 1
        elif action.status in ("approved", "executing"):
            pending_monthly += savings
            pending += 1
        elif action.status == "failed":
            failed += 1

    return SavingsSummary(
        verified_monthly_usd=round(verified_monthly, 2),
        pending_monthly_usd=round(pending_monthly, 2),
        verified_annual_usd=round(verified_monthly * 12, 2),
        actions_succeeded=succeeded,
        actions_pending=pending,
        actions_failed=failed,
    )
