"""
Heuristics for whether a phone call transcript indicates the subscription was cancelled.

Otto is instructed to obtain a confirmation number before ending (see docs/JAMIE_AGENT_PROMPT.md).
If we can extract that number from the transcript, we treat the attempt as successful.
"""

from __future__ import annotations

import re

# Rep may say "confirmation number is X", "your reference is X", etc.
_CONFIRMATION_NUMBER_PATTERNS: tuple[re.Pattern[str], ...] = (
    # Explicit "number is …" avoids capturing the word "number" as the ID
    re.compile(
        r"\b(?:confirmation|reference)\s+number\s+is\s+([A-Z0-9][A-Z0-9\-]{3,})\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\bconfirmation\s*(?:code|#)?\s*[:\s]\s*([A-Z0-9][A-Z0-9\-]{3,})\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\breference\s*(?:#|code)?\s*[:\s]\s*([A-Z0-9][A-Z0-9\-]{3,})\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:ticket|case)\s*(?:#|number)?\s*[:\s]\s*([A-Z0-9][A-Z0-9\-]{3,})\b",
        re.IGNORECASE,
    ),
    re.compile(
        r"\b(?:order|cancellation)\s*(?:#|id|number)?\s*[:\s]\s*([A-Z0-9][A-Z0-9\-]{4,})\b",
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
        {"number", "code", "here", "the", "your", "this", "that", "is", "are", "was"}
    )

    for pat in _CONFIRMATION_NUMBER_PATTERNS:
        m = pat.search(text)
        if m:
            raw = m.group(1).strip().rstrip(".,;:")
            low = raw.lower()
            if len(raw) < 4 or low in junk:
                continue
            # Prefer IDs that look like references (digit or hyphen) unless very long token
            if any(c.isdigit() for c in raw) or "-" in raw or len(raw) >= 8:
                return raw
            if len(raw) >= 6 and low not in junk:
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
        "processed your cancellation",
        "we've cancelled",
        "we have cancelled",
        "that's confirmed",
        "all set on the cancellation",
    )
    return any(p in text for p in phrases)
