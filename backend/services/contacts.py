"""
Hardcoded demo vendor contacts for ElevenLabs phone call fallback.

When Playwright automation fails for a merchant listed here, the system
initiates an outbound ElevenLabs call to the first contact in the list.

PHONE_FALLBACK_MERCHANTS: merchants that intentionally bypass browser
automation and go straight to phone (used for demo purposes).
"""

# Merchants that skip Playwright and trigger the phone call fallback
PHONE_FALLBACK_MERCHANTS: set[str] = {"heroku"}

# Demo account holder details passed to Jamie as dynamic variables
DEMO_ACCOUNT = {
    "full_name": "Acme Corp",
    "phone": "+15551230000",
}

# Vendor → ordered list of contacts to try (index 0 = primary)
VENDOR_CONTACTS: dict[str, list[dict]] = {
    "heroku": [
        {"name": "Kasuti Makau",      "phone": "+16033490400"},
        {"name": "Dickson Alexander", "phone": "+16032768643"},
        {"name": "Jake Tran",         "phone": "+16462208361"},
       
        {"name": "Lynn Lin",          "phone": "+15162348262"},
    ],
}


def get_contacts(merchant: str) -> list[dict]:
    """Return ordered contact list for a merchant, or [] if none configured."""
    return VENDOR_CONTACTS.get(merchant.lower(), [])
