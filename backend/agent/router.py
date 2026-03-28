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

    # Persist action plan
    db_plan = ActionPlanModel(
        id=plan.plan_id,
        org_id=ORG_ID,
        user_goal=plan.user_goal,
        total_savings_usd=plan.total_monthly_savings_usd,
        action_count=len(plan.actions),
        raw_llm_output=plan.model_dump(),
    )
    db.add(db_plan)

    # Persist each recommendation
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

    action_id = f"act_{uuid.uuid4().hex[:12]}"
    idempotency_key = f"{rec.action_type}_{rec.stream_id}"

    db_action = Action(
        id=action_id,
        org_id=ORG_ID,
        recommendation_id=req.recommendation_id,
        idempotency_key=idempotency_key,
        channel="browser",
        status="approved",
        approved_by=req.approved_by,
    )
    db.add(db_action)

    rec.status = "approved"
    db.commit()

    return ConfirmResponse(action_id=action_id)
