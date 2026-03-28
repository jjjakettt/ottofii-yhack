import json
import uuid
from datetime import datetime, timezone
from typing import List

import httpx
from openai import OpenAI
from google import genai as genai_client

from config import OPENAI_API_KEY, GOOGLE_GEMINI_API_KEY
from schemas import ActionItem, ActionPlan, Evidence, SkippedStream, Strategy
from agent.prompt import SYSTEM_PROMPT, build_user_prompt
from stubs import STUB_STREAMS

openai_client = OpenAI(api_key=OPENAI_API_KEY)
gemini = genai_client.Client(api_key=GOOGLE_GEMINI_API_KEY)


async def fetch_streams():
    """Fetch recurring streams from Person 2's endpoint, fall back to stubs."""
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get("http://localhost:8000/recurring-streams")
            resp.raise_for_status()
            from schemas import RecurringStream
            return [RecurringStream(**s) for s in resp.json()["streams"]]
    except Exception:
        return STUB_STREAMS


def _call_openai(system: str, user: str) -> dict:
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
    )
    return json.loads(response.choices[0].message.content)


def _call_gemini(system: str, user: str) -> dict:
    response = gemini.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"{system}\n\n{user}",
        config={"response_mime_type": "application/json"},
    )
    return json.loads(response.text)


def _call_llm(system: str, user: str) -> dict:
    try:
        return _call_openai(system, user)
    except Exception as openai_err:
        try:
            return _call_gemini(system, user)
        except Exception as gemini_err:
            raise RuntimeError(
                f"Both LLMs failed. OpenAI: {openai_err}. Gemini: {gemini_err}"
            )


def _parse_action_item(raw: dict) -> ActionItem:
    return ActionItem(
        recommendation_id=raw.get("recommendation_id", f"rec_{uuid.uuid4().hex[:8]}"),
        stream_id=raw["stream_id"],
        merchant=raw["merchant"],
        action_type=raw["action_type"],
        monthly_savings_usd=raw["monthly_savings_usd"],
        annual_savings_usd=raw.get("annual_savings_usd", raw["monthly_savings_usd"] * 12),
        confidence=raw["confidence"],
        regret_risk=raw["regret_risk"],
        rank=raw["rank"],
        explanation=raw["explanation"],
        evidence=Evidence(**raw["evidence"]),
        strategy=Strategy(**raw["strategy"]),
        idempotency_key=raw["idempotency_key"],
        require_user_confirmation=raw.get("require_user_confirmation", True),
    )


async def build_plan(user_goal: str) -> ActionPlan:
    streams = await fetch_streams()
    user_prompt = build_user_prompt(streams, user_goal)

    raw = _call_llm(SYSTEM_PROMPT, user_prompt)

    actions = [_parse_action_item(a) for a in raw.get("actions", [])]
    skipped = [SkippedStream(**s) for s in raw.get("skipped", [])]

    total_monthly = sum(a.monthly_savings_usd for a in actions)
    total_annual = sum(a.annual_savings_usd for a in actions)

    return ActionPlan(
        plan_id=f"plan_{uuid.uuid4().hex[:12]}",
        generated_at=datetime.now(timezone.utc).isoformat(),
        user_goal=user_goal,
        total_monthly_savings_usd=round(total_monthly, 2),
        total_annual_savings_usd=round(total_annual, 2),
        actions=sorted(actions, key=lambda a: a.rank),
        skipped=skipped,
    )
