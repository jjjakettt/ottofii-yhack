"""
Hardcoded demo vendor contacts for ElevenLabs phone call fallback.

When Playwright automation fails for a merchant listed here, the system
initiates an outbound ElevenLabs call to the first contact in the list.

PHONE_FALLBACK_MERCHANTS: merchants that intentionally bypass browser
automation and go straight to phone (used for demo purposes).
"""

# Merchants that skip Playwright and trigger the phone call fallback
PHONE_FALLBACK_MERCHANTS: set[str] = {"notion"}

# Demo account holder details passed to ElevenLabs as {{full_name}} / {{phone_number}}
DEMO_ACCOUNT = {
    "full_name": "Acme Corp",
    "phone": "+15551230000",
}

# Shared demo roster (same numbers as the former Heroku-only list)
_SHARED_PHONE_CONTACTS: list[dict] = [
    {"name": "Jake Tran",         "phone": "+16462208361"},
    {"name": "Dickson Alexander", "phone": "+16032768643"},
    {"name": "Kasuti Makau",      "phone": "+16033490400"},
    {"name": "Lynn Lin",          "phone": "+15162348262"},
]

# Vendor → ordered list of contacts to try (index 0 = primary)
VENDOR_CONTACTS: dict[str, list[dict]] = {
    "notion": _SHARED_PHONE_CONTACTS,
    "heroku": _SHARED_PHONE_CONTACTS,
}

# Extra labels that sometimes appear on streams / LLM output instead of display names
_MERCHANT_ALIASES: dict[str, str] = {
    "notion.so": "notion",
    "notion labs": "notion",
    "heroku inc": "heroku",
}


def get_contacts(merchant: str) -> list[dict]:
    """Return ordered contact list for a merchant, or [] if none configured."""
    key = merchant.strip().casefold()
    if key in VENDOR_CONTACTS:
        return VENDOR_CONTACTS[key]
    resolved = _MERCHANT_ALIASES.get(key)
    if resolved and resolved in VENDOR_CONTACTS:
        return VENDOR_CONTACTS[resolved]
    return []
