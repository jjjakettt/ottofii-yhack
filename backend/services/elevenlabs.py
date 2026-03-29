"""
ElevenLabs Conversational AI client for outbound phone calls.

Initiates a call via the Jamie agent and polls until the conversation completes.
"""

import asyncio
import logging
import os

import httpx

from config import ELEVENLABS_POLL_INTERVAL_S, ELEVENLABS_POLL_TIMEOUT_S
from services.execution_control import is_cancelled

logger = logging.getLogger(__name__)

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "")
ELEVENLABS_PHONE_NUMBER_ID = os.getenv("ELEVENLABS_PHONE_NUMBER_ID", "")
_BASE = "https://api.elevenlabs.io/v1"


def normalize_conv_status(raw: str | None) -> str:
    """ElevenLabs may return e.g. in-progress or in_progress — normalize for comparisons."""
    return (raw or "").strip().lower().replace("-", "_")


async def initiate_call(
    to_number: str,
    full_name: str,
    account_phone: str,
    subscription_name: str,
) -> str:
    """
    Initiate an outbound ElevenLabs call on behalf of full_name to cancel
    their subscription_name subscription.

    Returns the conversation_id to poll for status.
    Raises RuntimeError on API failure.
    """
    if not ELEVENLABS_API_KEY or not ELEVENLABS_AGENT_ID or not ELEVENLABS_PHONE_NUMBER_ID:
        raise RuntimeError(
            "ElevenLabs not configured: set ELEVENLABS_API_KEY, "
            "ELEVENLABS_AGENT_ID, and ELEVENLABS_PHONE_NUMBER_ID."
        )

    payload = {
        "agent_id": ELEVENLABS_AGENT_ID,
        "agent_phone_number_id": ELEVENLABS_PHONE_NUMBER_ID,
        "to_number": to_number,
        "conversation_initiation_client_data": {
            "dynamic_variables": {
                "full_name": full_name,
                "phone_number": account_phone,
                "subscription_name": subscription_name,
            }
        },
    }

    logger.info(
        "[ElevenLabs] Initiating call → %s | agent=%s | phone_number_id=%s | vars=%s",
        to_number, ELEVENLABS_AGENT_ID, ELEVENLABS_PHONE_NUMBER_ID,
        {"full_name": full_name, "subscription_name": subscription_name},
    )

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/convai/twilio/outbound-call",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            json=payload,
            timeout=30.0,
        )

        logger.info("[ElevenLabs] Initiate response: status=%s body=%s", resp.status_code, resp.text)

        try:
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise RuntimeError(
                f"ElevenLabs call initiation failed ({resp.status_code}): {resp.text}"
            ) from e

        data = resp.json()
        conversation_id = data.get("conversation_id")
        if not conversation_id:
            raise RuntimeError(
                f"ElevenLabs response missing conversation_id: {data}"
            )

        logger.info("[ElevenLabs] Call initiated ✓ conversation_id=%s", conversation_id)
        return conversation_id


async def poll_call_until_done(
    conversation_id: str,
    poll_interval_s: float | None = None,
    timeout_s: float | None = None,
    action_id: str | None = None,
) -> dict:
    """
    Poll until the conversation reaches a terminal state (done or failed) or timeout.

    Default interval comes from ELEVENLABS_POLL_INTERVAL_S (2s): faster than a 5s
    loop so the backend finishes soon after ElevenLabs marks the conversation done.
    Ring/connect/agent audio time is still dominated by Twilio + ElevenLabs.

    Unanswered or dropped calls often move to status 'failed' instead of staying
    'in-progress' until a long timeout — we exit as soon as we see 'failed'.

    If action_id is set, checks execution cancellation each poll so the user can
    abort a stuck call from the UI.

    Raises RuntimeError on timeout, API failure, or user cancellation.
    """
    if poll_interval_s is None:
        poll_interval_s = ELEVENLABS_POLL_INTERVAL_S
    if timeout_s is None:
        timeout_s = ELEVENLABS_POLL_TIMEOUT_S
    elapsed = 0.0
    logger.info("[ElevenLabs] Polling conversation_id=%s (timeout=%ss)", conversation_id, timeout_s)

    async with httpx.AsyncClient() as client:
        while elapsed < timeout_s:
            if action_id and is_cancelled(action_id):
                raise RuntimeError("Execution cancelled")

            resp = await client.get(
                f"{_BASE}/convai/conversations/{conversation_id}",
                headers={"xi-api-key": ELEVENLABS_API_KEY},
                timeout=10.0,
            )

            try:
                resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise RuntimeError(
                    f"ElevenLabs status poll failed ({resp.status_code}): {resp.text}"
                ) from e

            data = resp.json()
            raw_status = data.get("status", "unknown")
            status = normalize_conv_status(raw_status)
            logger.info("[ElevenLabs] Poll at %.0fs → status=%s", elapsed, raw_status)

            if status == "done":
                transcript = data.get("transcript", [])
                logger.info("[ElevenLabs] Call done ✓ transcript_turns=%d", len(transcript))
                return data

            if status == "failed":
                logger.info("[ElevenLabs] Conversation ended as failed (e.g. no answer)")
                return data

            await asyncio.sleep(poll_interval_s)
            elapsed += poll_interval_s

    raise RuntimeError(
        f"ElevenLabs call timed out after {timeout_s}s (conversation_id={conversation_id})"
    )


def format_transcript(transcript: list[dict]) -> str:
    """Convert ElevenLabs transcript list to a readable string."""
    lines = []
    for turn in transcript:
        role = turn.get("role", "unknown").capitalize()
        message = turn.get("message", "")
        if message:
            lines.append(f"{role}: {message}")
    return "\n".join(lines)
