"""
Heuristics for whether a phone call transcript indicates the subscription was cancelled.

Otto is instructed to obtain a confirmation number before ending (see docs/JAMIE_AGENT_PROMPT.md).
If we can extract that number from the transcript, we treat the attempt as successful.
"""

from __future__ import annotations

import re

# Rep may say "confirmation number is X", "your reference is X", etc.
_CONFIRMATION_NUMBER_PATTERNS: tuple[re.Pattern[str], ...] = (
    # "confirmation number (is|for|of|…) XYZ" — absorbs prepositions before the ID
    re.compile(
        r"\b(?:confirmation|reference|cancellation)\s+(?:number|code|id|#)\s+"
        r"(?:(?:is|for|of|to|a|the|your|our)\s+)?(\S+)",
        re.IGNORECASE,
    ),
    # "confirmation: XYZ" or "reference: XYZ"
    re.compile(
        r"\b(?:confirmation|reference)\s*[:#]\s*(\S+)",
        re.IGNORECASE,
    ),
    # "ticket/case number: XYZ"
    re.compile(
        r"\b(?:ticket|case)\s+(?:number|#|id)\s*[:#\s]\s*(\S+)",
        re.IGNORECASE,
    ),
)


def transcript_text(transcript: list[dict]) -> str:
    return " ".join(str(t.get("message") or "").strip() for t in transcript)


def extract_confirmation_number_from_transcript(transcript: list[dict]) -> str | None:
    """
    Best-effort extraction of a provider confirmation / reference number from the transcript.
    Returns the first plausible match, or None.
    """
    text = transcript_text(transcript)
    if len(text) < 10:
        return None

    junk = frozenset(
        {
            "number", "code", "here", "the", "your", "this", "that", "is", "are", "was",
            "for", "of", "to", "a", "an", "our", "my", "their", "its", "and", "or",
            "process", "processed", "complete", "completed", "cancelled", "canceled",
            "subscription", "account", "request", "cancellation", "done", "call",
        }
    )

    for pat in _CONFIRMATION_NUMBER_PATTERNS:
        m = pat.search(text)
        if m:
            raw = m.group(1).strip().strip(".,;:()")
            low = raw.lower()
            if len(raw) >= 3 and low not in junk:
                return raw
    return None


def cancellation_confirmed_in_transcript(transcript: list[dict]) -> bool:
    """
    True if cancellation is established: either a confirmation/reference number was given,
    or the transcript clearly states cancellation completed (fallback when no number parsed).
    """
    if not transcript:
        return False

    text = transcript_text(transcript).lower()

    # Strong signal: rep provided a confirmation / reference number Otto asked for
    if extract_confirmation_number_from_transcript(transcript) is not None:
        return True

    if len(text) < 30:
        return False

    phrases = (
        "cancelled",
        "canceled",
        "cancellation is complete",
        "cancellation has been processed",
        "processed the cancellation",
        "processed your cancellation",
        "subscription has been cancelled",
        "subscription has been canceled",
        "order has been cancelled",
        "order has been canceled",
        "order is cancelled",
        "successfully cancelled",
        "successfully canceled",
        "cancellation confirmed",
        "confirmed the cancellation",
        "has been cancelled",
        "your subscription is cancelled",
        "account has been closed",
        "membership has been cancelled",
        "i've cancelled",
        "i have cancelled",
        "we've cancelled",
        "we have cancelled",
        "that's confirmed",
        "all set on the cancellation",
        "gone ahead and cancelled",
        "gone ahead and canceled",
        "taken care of the cancellation",
        "all set for you",
    )
    return any(p in text for p in phrases)
