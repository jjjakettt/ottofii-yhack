"""
Person 4 — Execution / Policy
Endpoints:
  POST /agent/execute       — runs policy check + Playwright executor
  GET  /actions/{action_id} — returns action status + evidence
  GET  /savings/summary     — returns verified + pending savings totals
"""

import logging
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from database import get_db
from models import Action, ActionEvidence, AuditEvent, Recommendation, RecurringStream
from schemas import ActionDetail, ActionEvidenceSchema, ExecuteRequest, ExecuteResponse, SavingsSummary
from policy import check_policy
from executors.browser_cancel import browser_cancel
from services.contacts import get_contacts, PHONE_FALLBACK_MERCHANTS, DEMO_ACCOUNT
from services.elevenlabs import initiate_call, poll_call_until_done, format_transcript

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

    For merchants in PHONE_FALLBACK_MERCHANTS, browser automation is
    intentionally skipped and the ElevenLabs phone agent is used instead.
    """
    from database import SessionLocal
    db = SessionLocal()

    try:
        action = db.query(Action).filter(Action.id == action_id).first()
        if not action:
            return

        # ── Execute via Playwright (unless merchant forces phone fallback) ─────
        browser_error: str | None = None

        logger.info("[execution] Starting action_id=%s merchant=%s", action_id, merchant)

        if merchant.lower() in PHONE_FALLBACK_MERCHANTS:
            logger.info("[execution] %s is in PHONE_FALLBACK_MERCHANTS — skipping browser, going to phone", merchant)
            browser_error = (
                f"Browser automation unavailable for '{merchant}': "
                "vendor portal returned an unexpected response. "
                "Falling back to phone cancellation."
            )
        else:
            try:
                result = await browser_cancel(
                    subscription_id=subscription_id,
                    merchant=merchant,
                )

                db.add(ActionEvidence(
                    id=_new_id("evi_"),
                    action_id=action_id,
                    type="confirmation_id",
                    payload={"id": result["confirmation_id"]},
                ))
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

                rec = db.query(Recommendation).filter(
                    Recommendation.id == action.recommendation_id
                ).first()
                if rec:
                    rec.status = "completed"

                _write_audit(db, "action.succeeded", "action", action_id, {
                    "merchant": merchant,
                    "confirmation_id": result["confirmation_id"],
                })
                db.commit()
                return

            except RuntimeError as e:
                browser_error = str(e)

        # ── Phone fallback via ElevenLabs ─────────────────────────────────────
        logger.info("[execution] Browser failed for %s: %s", merchant, browser_error)
        logger.info("[execution] Looking up phone contacts for merchant=%s", merchant)

        contacts = get_contacts(merchant)
        if not contacts:
            logger.warning("[execution] No phone contacts found for %s — marking failed", merchant)
            action.status = "failed"
            action.executed_at = _now()
            _write_audit(db, "action.failed", "action", action_id, {
                "merchant": merchant,
                "error": browser_error,
            })
            db.commit()
            return

        contact = contacts[0]
        logger.info("[execution] Calling %s at %s for %s", contact["name"], contact["phone"], merchant)

        # Record the browser failure so the UI can show what happened
        db.add(ActionEvidence(
            id=_new_id("evi_"),
            action_id=action_id,
            type="browser_failure",
            payload={
                "error": browser_error,
                "fallback": "phone",
            },
        ))

        # Switch channel to phone
        action.channel = "phone"
        db.commit()

        _write_audit(db, "action.phone_fallback", "action", action_id, {
            "merchant": merchant,
            "contact_name": contact["name"],
            "contact_phone": contact["phone"],
            "browser_error": browser_error,
        })
        db.commit()

        try:
            logger.info("[execution] Initiating ElevenLabs call → %s (%s)", contact["phone"], contact["name"])
            conversation_id = await initiate_call(
                to_number=contact["phone"],
                full_name=DEMO_ACCOUNT["full_name"],
                account_phone=DEMO_ACCOUNT["phone"],
                subscription_name=merchant,
            )
            logger.info("[execution] Call initiated conversation_id=%s — now polling", conversation_id)

            conv_data = await poll_call_until_done(conversation_id)
            logger.info("[execution] Call completed for conversation_id=%s", conversation_id)

            transcript_text = format_transcript(conv_data.get("transcript", []))
            db.add(ActionEvidence(
                id=_new_id("evi_"),
                action_id=action_id,
                type="call_transcript",
                payload={
                    "conversation_id": conversation_id,
                    "contact_name": contact["name"],
                    "contact_phone": contact["phone"],
                    "transcript": conv_data.get("transcript", []),
                    "transcript_text": transcript_text,
                },
            ))

            action.status = "succeeded"
            action.executed_at = _now()

            rec = db.query(Recommendation).filter(
                Recommendation.id == action.recommendation_id
            ).first()
            if rec:
                rec.status = "completed"

            _write_audit(db, "action.succeeded", "action", action_id, {
                "merchant": merchant,
                "channel": "phone",
                "conversation_id": conversation_id,
                "contact_name": contact["name"],
            })

        except RuntimeError as call_error:
            logger.error("[execution] ElevenLabs call failed for %s: %s", merchant, call_error)
            action.status = "failed"
            action.executed_at = _now()
            _write_audit(db, "action.failed", "action", action_id, {
                "merchant": merchant,
                "channel": "phone",
                "error": str(call_error),
            })

        db.commit()

    finally:
        db.close()


# ── POST /actions/{action_id}/retry ──────────────────────────────────────────

@router.post("/actions/{action_id}/retry", response_model=ExecuteResponse)
async def retry_action(
    action_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Reset a failed action back to executing and re-run the executor.
    Clears previous evidence so the UI shows a clean retry attempt.
    """
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if action.status != "failed":
        raise HTTPException(
            status_code=409,
            detail=f"Action is in state '{action.status}', only 'failed' actions can be retried.",
        )

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

    # Clear previous evidence
    db.query(ActionEvidence).filter(ActionEvidence.action_id == action_id).delete()

    # Reset action state
    action.status = "executing"
    action.executed_at = None
    action.channel = "browser"
    db.commit()

    _write_audit(db, "action.retry", "action", action_id, {"merchant": stream.merchant})
    db.commit()

    tool_args = action.tool_args or {}
    subscription_id = tool_args.get("stream_id", recommendation.stream_id)

    background_tasks.add_task(
        _run_execution,
        action_id=str(action.id),
        subscription_id=str(subscription_id),
        merchant=str(stream.merchant),
    )

    return ExecuteResponse(action_id=str(action.id), status="executing")


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
