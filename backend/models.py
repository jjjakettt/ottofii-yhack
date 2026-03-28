"""
SQLAlchemy ORM — defines DB tables.
Run once via init_db.py to create tables in Supabase.
Person 3 and 4: import from here, do NOT modify.
"""
from sqlalchemy import (
    Column, String, Text, Numeric, Integer, Boolean,
    TIMESTAMP, Date, JSON, ForeignKey
)
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    org_id = Column(String)
    role = Column(String)  # 'cfo' | 'ap' | 'it' | 'procurement'
    created_at = Column(TIMESTAMP, server_default=func.now())


class Connection(Base):
    __tablename__ = "connections"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    org_id = Column(String)
    type = Column(String)    # 'bank' | 'erp' | 'email' | 'saas' | 'cloud'
    status = Column(String)  # 'active' | 'error' | 'pending'
    last_synced = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())


class RecurringStream(Base):
    __tablename__ = "recurring_streams"

    id = Column(String, primary_key=True)
    org_id = Column(String)
    merchant = Column(String, nullable=False)
    raw_merchant = Column(String)
    category = Column(String)   # 'saas' | 'cloud' | 'media' | 'utility' | ...
    cadence = Column(String)    # 'monthly' | 'annual' | 'quarterly'
    amount_usd = Column(Numeric(12, 2))
    seat_count = Column(Integer)
    last_seen = Column(Date)
    first_seen = Column(Date)
    occurrence_count = Column(Integer)
    confidence = Column(Numeric(4, 3))  # 0.000–1.000
    usage_signal = Column(String)       # 'active' | 'low' | 'none' | 'unknown'
    source = Column(String)
    notes = Column(Text)
    is_protected = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ActionPlan(Base):
    __tablename__ = "action_plans"

    id = Column(String, primary_key=True)
    org_id = Column(String)
    user_goal = Column(Text)
    total_savings_usd = Column(Numeric(12, 2))
    action_count = Column(Integer)
    raw_llm_output = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(String, primary_key=True)
    org_id = Column(String)
    stream_id = Column(String, ForeignKey("recurring_streams.id"))
    action_type = Column(String)    # 'cancel' | 'downgrade' | 'negotiate' | 'switch'
    savings_usd = Column(Numeric(12, 2))
    savings_annual = Column(Numeric(12, 2))
    confidence = Column(Numeric(4, 3))
    regret_risk = Column(String)    # 'low' | 'medium' | 'high'
    explanation = Column(Text)
    evidence = Column(JSON)
    status = Column(String, default="pending")  # 'pending' | 'approved' | 'rejected' | 'deferred'
    plan_id = Column(String, ForeignKey("action_plans.id"))
    created_at = Column(TIMESTAMP, server_default=func.now())


class Action(Base):
    __tablename__ = "actions"

    id = Column(String, primary_key=True)
    org_id = Column(String)
    recommendation_id = Column(String, ForeignKey("recommendations.id"))
    tool_name = Column(String)
    tool_args = Column(JSON)
    idempotency_key = Column(String, unique=True)
    channel = Column(String)    # 'api' | 'email' | 'browser' | 'phone'
    status = Column(String, default="proposed")
    approved_by = Column(String)
    approved_at = Column(TIMESTAMP)
    executed_at = Column(TIMESTAMP)
    verified_at = Column(TIMESTAMP)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ActionEvidence(Base):
    __tablename__ = "action_evidence"

    id = Column(String, primary_key=True)
    action_id = Column(String, ForeignKey("actions.id"))
    type = Column(String)   # 'screenshot' | 'confirmation_email' | 'confirmation_id' | 'html'
    payload = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String, primary_key=True)
    org_id = Column(String)
    actor = Column(String)       # user_id or 'system'
    event_type = Column(String)
    object_type = Column(String)
    object_id = Column(String)
    payload = Column(JSON)
    created_at = Column(TIMESTAMP, server_default=func.now())
