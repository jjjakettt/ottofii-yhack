"""
Person 4 — Execution / Policy
Endpoints:
  POST /agent/execute       — runs policy check + Playwright executor
  GET  /actions/{action_id} — returns action status + evidence
  GET  /savings/summary     — returns verified + pending savings totals
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Action, ActionEvidence, AuditEvent, Recommendation, RecurringStream
from schemas import ActionDetail, ActionEvidenceSchema, ExecuteRequest, ExecuteResponse, SavingsSummary
from policy import check_policy
from executors.browser_cancel import browser_cancel

router = APIRouter()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _now() -> datetime:
    return datetime.now(timezone.utc)


def _new_id(prefix: str = "") -> str:
    return f"{prefix}{uuid.uuid4().hex[:12]}"


def _write_audit(db: Session, event_type: str, object_type: str, object_id: str, payload: dict):
    db.add(AuditEvent(
        id=_new_id("evt_"),
        org_id="org_demo",
        actor="system",
        event_type=event_type,
        object_type=object_type,
        object_id=object_id,
        payload=payload,
    ))


# ── Background task: run Playwright + update DB ───────────────────────────────

async def _run_execution(action_id: str, subscription_id: str, merchant: str):
    """
    Runs in the background after POST /agent/execute returns.
    Updates action status and stores evidence in DB.
    """
    from database import SessionLocal
    db = SessionLocal()

    try:
        action = db.query(Action).filter(Action.id == action_id).first()
        if not action:
            return

        # ── Execute via Playwright ─────────────────────────────────────────
        try:
            result = await browser_cancel(
                subscription_id=subscription_id,
                merchant=merchant,
            )

            # Store confirmation ID evidence
            db.add(ActionEvidence(
                id=_new_id("evi_"),
                action_id=action_id,
                type="confirmation_id",
                payload={"id": result["confirmation_id"]},
            ))

            # Store screenshot evidence (base64 in DB — no file storage needed)
            db.add(ActionEvidence(
                id=_new_id("evi_"),
                action_id=action_id,
                type="screenshot",
                payload={
                    "base64": result["screenshot_base64"],
                    "mime": result["mime"],
                },
            ))

            action.status = "succeeded"
            action.executed_at = _now()

            # Mark the recommendation as completed so frontend filters it out
            rec = db.query(Recommendation).filter(
                Recommendation.id == action.recommendation_id
            ).first()
            if rec:
                rec.status = "completed"

            _write_audit(db, "action.succeeded", "action", action_id, {
                "merchant": merchant,
                "confirmation_id": result["confirmation_id"],
            })

        except RuntimeError as e:
            action.status = "failed"
            action.executed_at = _now()

            _write_audit(db, "action.failed", "action", action_id, {
                "merchant": merchant,
                "error": str(e),
            })

        db.commit()

    finally:
        db.close()


# ── POST /agent/execute ───────────────────────────────────────────────────────

@router.post("/agent/execute", response_model=ExecuteResponse)
async def execute_action(
    body: ExecuteRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Validates policy, updates status to executing, then runs
    the Playwright executor in the background.
    Person 1 calls this immediately after POST /agent/confirm.
    """
    # ── Fetch action ───────────────────────────────────────────────────────
    action = db.query(Action).filter(Action.id == body.action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    # ── Idempotency: already executed successfully ──────────────────────────
    if action.status == "succeeded":
        return ExecuteResponse(action_id=action.id, status="succeeded")

    if action.status not in ("approved",):
        raise HTTPException(
            status_code=409,
            detail=f"Action is in state '{action.status}', expected 'approved'.",
        )

    # ── Fetch linked stream for policy check ───────────────────────────────
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == action.recommendation_id
    ).first()
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    stream = db.query(RecurringStream).filter(
        RecurringStream.id == recommendation.stream_id
    ).first()
    if not stream:
        raise HTTPException(status_code=404, detail="Recurring stream not found")

    # ── Policy check ───────────────────────────────────────────────────────
    policy = check_policy(stream, action)
    if not policy["allowed"]:
        action.status = "failed"
        db.commit()
        raise HTTPException(status_code=403, detail=policy["reason"])

    # ── Update to executing ────────────────────────────────────────────────
    action.status = "executing"
    db.commit()

    _write_audit(db, "action.executing", "action", action.id, {
        "merchant": stream.merchant,
        "channel": action.channel,
    })
    db.commit()

    # ── Dispatch executor in background ───────────────────────────────────
    # subscription_id from tool_args (set by Person 3 when creating action)
    tool_args = action.tool_args or {}
    subscription_id = tool_args.get("stream_id", recommendation.stream_id)

    background_tasks.add_task(
        _run_execution,
        action_id=str(action.id),
        subscription_id=str(subscription_id),
        merchant=str(stream.merchant),
    )

    return ExecuteResponse(action_id=str(action.id), status="executing")


# ── GET /actions/{action_id} ──────────────────────────────────────────────────

@router.get("/actions/{action_id}", response_model=ActionDetail)
def get_action(action_id: str, db: Session = Depends(get_db)):
    """
    Returns action status + evidence.
    Person 1 polls this every 3s while status == 'executing'.
    """
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    recommendation = db.query(Recommendation).filter(
        Recommendation.id == action.recommendation_id
    ).first()

    stream = db.query(RecurringStream).filter(
        RecurringStream.id == recommendation.stream_id
    ).first() if recommendation else None

    evidence_rows = db.query(ActionEvidence).filter(
        ActionEvidence.action_id == action_id
    ).all()

    evidence = [
        ActionEvidenceSchema(type=e.type, payload=e.payload or {})
        for e in evidence_rows
    ]

    return ActionDetail(
        id=str(action.id),
        recommendation_id=str(action.recommendation_id or ""),
        merchant=str(stream.merchant) if stream else "Unknown",
        action_type=str(recommendation.action_type) if recommendation else "cancel",
        status=str(action.status),
        channel=str(action.channel or "browser"),
        idempotency_key=str(action.idempotency_key or ""),
        approved_at=action.approved_at.isoformat() if action.approved_at else None,
        executed_at=action.executed_at.isoformat() if action.executed_at else None,
        verified_at=action.verified_at.isoformat() if action.verified_at else None,
        evidence=evidence,
        monthly_savings_usd=float(recommendation.savings_usd) if recommendation and recommendation.savings_usd else 0.0,
    )


# ── GET /savings/summary ──────────────────────────────────────────────────────

@router.get("/savings/summary", response_model=SavingsSummary)
def get_savings_summary(db: Session = Depends(get_db)):
    """
    Aggregates verified and pending savings across all actions.
    Person 1 uses this for the dashboard savings tracker widget.
    """
    actions = db.query(Action).filter(Action.org_id == "org_demo").all()

    verified_monthly = 0.0
    pending_monthly = 0.0
    succeeded = 0
    pending_count = 0
    failed = 0

    for action in actions:
        rec = db.query(Recommendation).filter(
            Recommendation.id == action.recommendation_id
        ).first()
        savings = float(rec.savings_usd) if rec and rec.savings_usd else 0.0

        if action.status == "succeeded":
            verified_monthly += savings
            succeeded += 1
        elif action.status in ("approved", "executing"):
            pending_monthly += savings
            pending_count += 1
        elif action.status == "failed":
            failed += 1

    return SavingsSummary(
        verified_monthly_usd=verified_monthly,
        pending_monthly_usd=pending_monthly,
        verified_annual_usd=verified_monthly * 12,
        actions_succeeded=succeeded,
        actions_pending=pending_count,
        actions_failed=failed,
    )
