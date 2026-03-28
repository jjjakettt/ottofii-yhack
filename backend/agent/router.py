import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import ActionPlan as ActionPlanModel, Recommendation, Action
from agent.planner import build_plan
from schemas import ActionPlan, ConfirmRequest, ConfirmResponse

router = APIRouter()

ORG_ID = "org_demo"


class PlanRequest(BaseModel):
    user_goal: str


@router.post("/plan", response_model=ActionPlan)
async def agent_plan(req: PlanRequest, db: Session = Depends(get_db)):
    plan = await build_plan(req.user_goal)

    db_plan = ActionPlanModel(
        id=plan.plan_id,
        org_id=ORG_ID,
        user_goal=plan.user_goal,
        total_savings_usd=plan.total_monthly_savings_usd,
        action_count=len(plan.actions),
        raw_llm_output=plan.model_dump(),
    )
    db.add(db_plan)

    for action in plan.actions:
        db_rec = Recommendation(
            id=action.recommendation_id,
            org_id=ORG_ID,
            stream_id=action.stream_id,
            action_type=action.action_type,
            savings_usd=action.monthly_savings_usd,
            savings_annual=action.annual_savings_usd,
            confidence=action.confidence,
            regret_risk=action.regret_risk,
            explanation=action.explanation,
            evidence=action.evidence.model_dump(),
            status="pending",
            plan_id=plan.plan_id,
        )
        db.add(db_rec)

    db.commit()
    return plan


@router.post("/confirm", response_model=ConfirmResponse)
def agent_confirm(req: ConfirmRequest, db: Session = Depends(get_db)):
    rec = db.query(Recommendation).filter(
        Recommendation.id == req.recommendation_id
    ).first()

    if not rec:
        raise HTTPException(status_code=404, detail="recommendation_id not found")

    if rec.status != "pending":
        raise HTTPException(status_code=409, detail=f"Recommendation is already {rec.status}")

    # Look up strategy from the stored ActionPlan output
    db_plan = db.query(ActionPlanModel).filter(ActionPlanModel.id == rec.plan_id).first()
    strategy = {}
    if db_plan and db_plan.raw_llm_output:
        raw_actions = db_plan.raw_llm_output.get("actions", [])
        match = next((a for a in raw_actions if a["recommendation_id"] == req.recommendation_id), None)
        if match:
            strategy = match.get("strategy", {})

    action_id = f"act_{uuid.uuid4().hex[:12]}"
    idempotency_key = f"{rec.action_type}_{rec.stream_id}"

    tool_args = {
        "stream_id": rec.stream_id,
        "action_type": rec.action_type,
        "idempotency_key": idempotency_key,
        "channel": strategy.get("channel", "browser"),
        "runbook_id": strategy.get("runbook_id"),
        "fallback_channel": strategy.get("fallback_channel"),
        "email_template_id": strategy.get("email_template_id"),
    }

    db_action = Action(
        id=action_id,
        org_id=ORG_ID,
        recommendation_id=req.recommendation_id,
        idempotency_key=idempotency_key,
        channel=tool_args["channel"],
        tool_args=tool_args,
        status="approved",
        approved_by=req.approved_by,
    )
    db.add(db_action)

    rec.status = "approved"
    db.commit()

    return ConfirmResponse(action_id=action_id)
