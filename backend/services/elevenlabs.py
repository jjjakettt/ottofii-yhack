"""
ElevenLabs Conversational AI client for outbound phone calls.

Initiates a call via the Jamie agent and polls until the conversation completes.
"""

import asyncio
import os

import httpx

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_AGENT_ID = os.getenv("ELEVENLABS_AGENT_ID", "")
ELEVENLABS_PHONE_NUMBER_ID = os.getenv("ELEVENLABS_PHONE_NUMBER_ID", "")
_BASE = "https://api.elevenlabs.io/v1"


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

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_BASE}/convai/conversations/outbound_call",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            json={
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
            },
            timeout=30.0,
        )
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
        return conversation_id


async def poll_call_until_done(
    conversation_id: str,
    poll_interval_s: float = 5.0,
    timeout_s: float = 300.0,
) -> dict:
    """
    Poll the conversation until status == 'done' or timeout is reached.
    Returns the full conversation data dict.
    Raises RuntimeError on timeout or API failure.
    """
    elapsed = 0.0
    async with httpx.AsyncClient() as client:
        while elapsed < timeout_s:
            resp = await client.get(
                f"{_BASE}/convai/conversations/{conversation_id}",
                headers={"xi-api-key": ELEVENLABS_API_KEY},
                timeout=15.0,
            )
            try:
                resp.raise_for_status()
            except httpx.HTTPStatusError as e:
                raise RuntimeError(
                    f"ElevenLabs status poll failed ({resp.status_code}): {resp.text}"
                ) from e

            data = resp.json()
            if data.get("status") == "done":
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
