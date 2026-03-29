"""Tests for transcript confirmation heuristics."""

from services.phone_outcome import (
    cancellation_confirmed_in_transcript,
    extract_confirmation_number_from_transcript,
)


def test_extract_confirmation_number():
    t = [
        {"role": "user", "message": "Your confirmation number is ABC-12345."},
    ]
    assert extract_confirmation_number_from_transcript(t) == "ABC-12345"


def test_success_when_number_present():
    t = [
        {"role": "user", "message": "I've cancelled that for you."},
        {"role": "user", "message": "Reference number is XK-99998888 for your records."},
    ]
    assert extract_confirmation_number_from_transcript(t) == "XK-99998888"
    assert cancellation_confirmed_in_transcript(t) is True


def test_success_phrase_without_number():
    t = [
        {"role": "user", "message": " " * 5},
        {"role": "user", "message": "Your subscription has been cancelled as requested today."},
    ]
    assert extract_confirmation_number_from_transcript(t) is None
    assert cancellation_confirmed_in_transcript(t) is True
