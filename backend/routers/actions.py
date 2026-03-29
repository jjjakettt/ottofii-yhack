"""
Person 4 — Execution / Policy
Endpoints:
  POST /agent/execute       — runs policy check + Playwright executor
  GET  /actions/{action_id} — returns action status + evidence
  GET  /savings/summary     — returns verified + pending savings totals
"""

import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from database import get_db
from models import Action, ActionEvidence, AuditEvent, Recommendation, RecurringStream
from schemas import (
    ActionDetail,
    ActionEvidenceSchema,
    ActionStatus,
    ExecuteRequest,
    ExecuteResponse,
    SavingsSummary,
)
from policy import check_policy
from executors.browser_cancel import browser_cancel
from services.contacts import get_contacts, PHONE_FALLBACK_MERCHANTS, DEMO_ACCOUNT
from services.execution_control import request_cancel, is_cancelled, clear_cancel
from services.elevenlabs import (
    initiate_call,
    poll_call_until_done,
    format_transcript,
    normalize_conv_status,
)
from services.phone_outcome import (
    cancellation_confirmed_in_transcript,
    extract_confirmation_number_from_transcript,
)

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


async def _schedule_phone_retry(action_id: str, subscription_id: str, merchant: str, delay_s: float):
    """After a delay, move action back to executing and call the next contact only."""
    await asyncio.sleep(delay_s)
    from database import SessionLocal
    db = SessionLocal()
    try:
        action = db.query(Action).filter(Action.id == action_id).first()
        if not action:
            return
        ta = dict(action.tool_args or {})
        if not ta.get("phone_retry_pending"):
            logger.info(
                "[execution] Scheduled phone retry cancelled or already cleared action_id=%s",
                action_id,
            )
            return
        ta["phone_resume"] = True
        ta.pop("phone_retry_pending", None)
        action.tool_args = ta
        action.status = "executing"
        action.executed_at = None
        db.commit()
    finally:
        db.close()

    logger.info(
        "[execution] Scheduled phone retry starting action_id=%s merchant=%s",
        action_id, merchant,
    )
    await _run_execution(action_id, subscription_id, merchant)


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
        clear_cancel(action_id)

        action = db.query(Action).filter(Action.id == action_id).first()
        if not action:
            return

        # ── Execute via Playwright (unless merchant forces phone fallback) ─────
        browser_error: str | None = None

        logger.info("[execution] Starting action_id=%s merchant=%s", action_id, merchant)

        if merchant.strip().casefold() in PHONE_FALLBACK_MERCHANTS:
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

        ta_state = dict(action.tool_args or {})
        phone_resume = bool(ta_state.get("phone_resume"))
        contact_idx = int(ta_state.get("phone_contact_index", 0) or 0)

        if not phone_resume:
            db.add(ActionEvidence(
                id=_new_id("evi_"),
                action_id=action_id,
                type="browser_failure",
                payload={
                    "error": browser_error,
                    "fallback": "phone",
                },
            ))
            action.channel = "phone"
            db.commit()

            _write_audit(db, "action.phone_fallback", "action", action_id, {
                "merchant": merchant,
                "contacts": [c["name"] for c in contacts],
                "browser_error": browser_error,
            })
            db.commit()
        else:
            ta_state.pop("phone_resume", None)
            action.tool_args = ta_state
            db.commit()

        if contact_idx >= len(contacts):
            logger.warning(
                "[execution] phone_contact_index=%s out of range — marking failed",
                contact_idx,
            )
            action.status = "failed"
            action.executed_at = _now()
            _write_audit(db, "action.failed", "action", action_id, {
                "merchant": merchant,
                "channel": "phone",
                "error": "No more contacts to call.",
            })
            db.commit()
            return

        contact = contacts[contact_idx]

        if is_cancelled(action_id):
            action = db.query(Action).filter(Action.id == action_id).first()
            if action and action.status == "failed":
                db.commit()
            return

        logger.info(
            "[execution] Phone attempt %s/%s → %s at %s (%s)",
            contact_idx + 1,
            len(contacts),
            contact["name"],
            contact["phone"],
            merchant,
        )

        try:
            conversation_id = await initiate_call(
                to_number=contact["phone"],
                full_name=DEMO_ACCOUNT["full_name"],
                account_phone=DEMO_ACCOUNT["phone"],
                subscription_name=merchant,
            )
            logger.info("[execution] Call initiated conversation_id=%s — now polling", conversation_id)

            conv_data = await poll_call_until_done(
                conversation_id,
                action_id=action_id,
            )
            conv_status = normalize_conv_status(conv_data.get("status"))
            transcript = conv_data.get("transcript") or []

            confirmed = conv_status == "done" and cancellation_confirmed_in_transcript(transcript)

            if confirmed:
                logger.info("[execution] Cancellation confirmed with %s — done", contact["name"])

                transcript_text = format_transcript(transcript)
                confirmation_number = extract_confirmation_number_from_transcript(transcript)
                db.add(ActionEvidence(
                    id=_new_id("evi_"),
                    action_id=action_id,
                    type="call_transcript",
                    payload={
                        "conversation_id": conversation_id,
                        "contact_name": contact["name"],
                        "contact_phone": contact["phone"],
                        "transcript": transcript,
                        "transcript_text": transcript_text,
                        "confirmation_number": confirmation_number,
                    },
                ))

                ta_ok = dict(action.tool_args or {})
                for k in ("phone_contact_index", "phone_retry_pending", "phone_resume"):
                    ta_ok.pop(k, None)
                action.tool_args = ta_ok

                action.status = "succeeded"
                action.executed_at = _now()

                rec = db.query(Recommendation).filter(
                    Recommendation.id == action.recommendation_id
                ).first()
                if rec:
                    rec.status = "completed"

                audit_ok: dict = {
                    "merchant": merchant,
                    "channel": "phone",
                    "conversation_id": conversation_id,
                    "contact_name": contact["name"],
                }
                if confirmation_number:
                    audit_ok["confirmation_number"] = confirmation_number
                _write_audit(db, "action.succeeded", "action", action_id, audit_ok)
                db.commit()
                return

            if conv_status == "done" and not cancellation_confirmed_in_transcript(transcript):
                reason = (
                    "The call finished, but cancellation was not clearly confirmed in the transcript. "
                    "Another attempt can be scheduled."
                )
            else:
                err_detail = conv_data.get("status") or "failed"
                reason = f"Call ended without confirmed cancellation (status={err_detail})."

            db.add(ActionEvidence(
                id=_new_id("evi_"),
                action_id=action_id,
                type="phone_attempt",
                payload={
                    "contact_name": contact["name"],
                    "contact_phone": contact["phone"],
                    "conversation_id": conversation_id,
                    "conversation_status": conv_data.get("status"),
                    "error": reason,
                },
            ))

            if contact_idx + 1 < len(contacts):
                delay_s = random.uniform(60.0, 120.0)
                ta_next = dict(action.tool_args or {})
                ta_next["phone_contact_index"] = contact_idx + 1
                ta_next["phone_retry_pending"] = True
                action.tool_args = ta_next
                action.status = "failed"
                action.executed_at = _now()
                next_c = contacts[contact_idx + 1]
                db.add(ActionEvidence(
                    id=_new_id("evi_"),
                    action_id=action_id,
                    type="phone_retry_scheduled",
                    payload={
                        "message": reason,
                        "retry_after_seconds": round(delay_s),
                        "retry_window_minutes": "1–2",
                        "next_contact_name": next_c["name"],
                        "next_contact_phone": next_c["phone"],
                    },
                ))
                _write_audit(db, "action.failed", "action", action_id, {
                    "merchant": merchant,
                    "channel": "phone",
                    "error": reason,
                    "scheduled_retry_in_s": round(delay_s),
                })
                db.commit()
                asyncio.create_task(
                    _schedule_phone_retry(action_id, subscription_id, merchant, delay_s)
                )
                return

            action.status = "failed"
            action.executed_at = _now()
            _write_audit(db, "action.failed", "action", action_id, {
                "merchant": merchant,
                "channel": "phone",
                "error": reason,
            })
            db.commit()
            return

        except RuntimeError as call_error:
            err_s = str(call_error)
            if "cancelled" in err_s.lower():
                action = db.query(Action).filter(Action.id == action_id).first()
                if action:
                    db.refresh(action)
                if action and action.status == "failed":
                    db.commit()
                    return
                action.status = "failed"
                action.executed_at = _now()
                _write_audit(db, "action.failed", "action", action_id, {
                    "merchant": merchant,
                    "channel": "phone",
                    "error": err_s,
                })
                db.commit()
                return

            logger.error("[execution] ElevenLabs attempt failed for %s: %s", merchant, call_error)
            db.add(ActionEvidence(
                id=_new_id("evi_"),
                action_id=action_id,
                type="phone_attempt",
                payload={
                    "contact_name": contact["name"],
                    "contact_phone": contact["phone"],
                    "error": err_s,
                },
            ))

            if contact_idx + 1 < len(contacts):
                delay_s = random.uniform(60.0, 120.0)
                ta_next = dict(action.tool_args or {})
                ta_next["phone_contact_index"] = contact_idx + 1
                ta_next["phone_retry_pending"] = True
                action.tool_args = ta_next
                action.status = "failed"
                action.executed_at = _now()
                next_c = contacts[contact_idx + 1]
                db.add(ActionEvidence(
                    id=_new_id("evi_"),
                    action_id=action_id,
                    type="phone_retry_scheduled",
                    payload={
                        "message": err_s,
                        "retry_after_seconds": round(delay_s),
                        "retry_window_minutes": "1–2",
                        "next_contact_name": next_c["name"],
                        "next_contact_phone": next_c["phone"],
                    },
                ))
                _write_audit(db, "action.failed", "action", action_id, {
                    "merchant": merchant,
                    "channel": "phone",
                    "error": err_s,
                    "scheduled_retry_in_s": round(delay_s),
                })
                db.commit()
                asyncio.create_task(
                    _schedule_phone_retry(action_id, subscription_id, merchant, delay_s)
                )
                return

            action.status = "failed"
            action.executed_at = _now()
            _write_audit(db, "action.failed", "action", action_id, {
                "merchant": merchant,
                "channel": "phone",
                "error": err_s,
            })
            db.commit()
            return

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

    clear_cancel(action_id)

    ta = dict(action.tool_args or {})
    for k in ("phone_contact_index", "phone_retry_pending", "phone_resume"):
        ta.pop(k, None)
    action.tool_args = ta

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


# ── POST /actions/{action_id}/cancel ───────────────────────────────────────────

@router.post("/actions/{action_id}/cancel", response_model=ExecuteResponse)
def cancel_executing_action(action_id: str, db: Session = Depends(get_db)):
    """
    Mark an executing action as failed and signal the background worker to stop
    polling (e.g. stuck on an unanswered ElevenLabs call).
    """
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if action.status != "executing":
        raise HTTPException(
            status_code=409,
            detail=f"Action is '{action.status}', only 'executing' actions can be cancelled.",
        )

    request_cancel(action_id)

    ta = dict(action.tool_args or {})
    ta.pop("phone_retry_pending", None)
    action.tool_args = ta

    action.status = "failed"
    action.executed_at = _now()
    db.add(ActionEvidence(
        id=_new_id("evi_"),
        action_id=action_id,
        type="execution_cancelled",
        payload={"reason": "user_cancelled"},
    ))
    _write_audit(db, "action.cancelled", "action", action_id, {})
    db.commit()

    return ExecuteResponse(action_id=str(action.id), status=ActionStatus.failed)


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
