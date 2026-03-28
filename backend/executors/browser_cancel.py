"""
Playwright executor — browser-based subscription cancellation.
Automates the demo portal at DEMO_PORTAL_URL.

Flow:
  login → subscriptions → click cancel → confirm → read receipt

Returns:
  {
    "confirmation_id": str,
    "screenshot_base64": str,   # base64-encoded PNG
    "mime": "image/png"
  }

Run standalone to test (demo portal must be running):
  python -m executors.browser_cancel
"""

import base64
import os
from playwright.async_api import async_playwright

DEMO_PORTAL_URL = os.getenv("DEMO_PORTAL_URL", "http://localhost:3000")
DEMO_EMAIL = "demo@acmecorp.com"
DEMO_PASSWORD = "demo1234"


async def browser_cancel(
    subscription_id: str,
    merchant: str,
) -> dict:
    """
    Automate a cancellation through the demo portal.

    Args:
        subscription_id: matches data-subscription-id on the subscriptions page
                         (e.g. "stream_001" for Notion)
        merchant:        human-readable name used in URL params (e.g. "Notion")

    Returns dict with confirmation_id, screenshot_base64, mime.
    Raises RuntimeError on any failure with a descriptive message.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        try:
            # ── Step 1: Login ──────────────────────────────────────────────
            await page.goto(f"{DEMO_PORTAL_URL}/demo/login", wait_until="networkidle")
            await page.fill('input[name="email"]', DEMO_EMAIL)
            await page.fill('input[name="password"]', DEMO_PASSWORD)
            await page.click('button[type="submit"]')

            # ── Step 2: Subscriptions list ─────────────────────────────────
            await page.wait_for_url("**/demo/subscriptions", timeout=10_000)

            cancel_button = page.locator(
                f'button[data-subscription-id="{subscription_id}"][data-action="cancel"]'
            )

            if not await cancel_button.is_visible():
                raise RuntimeError(
                    f"Cancel button not found for subscription_id='{subscription_id}'. "
                    f"Check that the demo portal subscriptions list includes this stream."
                )

            await cancel_button.click()

            # ── Step 3: Confirm cancellation ───────────────────────────────
            await page.wait_for_url("**/demo/confirm-cancel**", timeout=10_000)
            await page.click('button[data-action="confirm"]')

            # ── Step 4: Receipt — read confirmation ID ─────────────────────
            await page.wait_for_url("**/demo/receipt**", timeout=10_000)

            # Wait for the confirmation ID to be rendered
            confirmation_el = page.locator('[data-field="confirmation_id"]')
            await confirmation_el.wait_for(state="visible", timeout=5_000)
            confirmation_id = await confirmation_el.text_content()

            if not confirmation_id:
                raise RuntimeError("Confirmation ID element found but was empty.")

            # ── Step 5: Screenshot ─────────────────────────────────────────
            screenshot_bytes = await page.screenshot(full_page=False)
            screenshot_base64 = base64.b64encode(screenshot_bytes).decode("utf-8")

            return {
                "confirmation_id": confirmation_id.strip(),
                "screenshot_base64": screenshot_base64,
                "mime": "image/png",
            }

        except RuntimeError:
            raise

        except Exception as e:
            raise RuntimeError(
                f"Playwright execution failed for '{merchant}' (id={subscription_id}): {e}"
            ) from e

        finally:
            await context.close()
            await browser.close()


# ── Standalone test ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import asyncio

    async def _test():
        print("Testing browser_cancel against demo portal...")
        print(f"Portal URL: {DEMO_PORTAL_URL}")
        print()

        result = await browser_cancel(
            subscription_id="stream_001",
            merchant="Notion",
        )

        print(f"Confirmation ID : {result['confirmation_id']}")
        print(f"Screenshot size : {len(result['screenshot_base64'])} base64 chars")
        print(f"MIME type       : {result['mime']}")
        print()
        print("Success! The executor is working correctly.")

    asyncio.run(_test())
