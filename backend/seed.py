"""
One-time script: populates mock data into Supabase.
Run: python seed.py
Run with reset: python seed.py --reset
"""
import sys
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User, Connection, RecurringStream, ActionEvidence, Action, Recommendation, ActionPlan
from seed_data import RECURRING_STREAMS, DEMO_ORG_ID, DEMO_USER_ID


def reset_db(db: Session):
    print("Resetting seed data...")
    # Delete in reverse FK dependency order
    db.query(ActionEvidence).filter(
        ActionEvidence.action_id.in_(
            db.query(Action.id).filter(Action.org_id == DEMO_ORG_ID)
        )
    ).delete(synchronize_session="fetch")
    db.query(Action).filter(Action.org_id == DEMO_ORG_ID).delete()
    db.query(Recommendation).filter(Recommendation.org_id == DEMO_ORG_ID).delete()
    db.query(ActionPlan).filter(ActionPlan.org_id == DEMO_ORG_ID).delete()
    db.query(RecurringStream).filter(RecurringStream.org_id == DEMO_ORG_ID).delete()
    db.query(Connection).filter(Connection.org_id == DEMO_ORG_ID).delete()
    db.query(User).filter(User.id == DEMO_USER_ID).delete()
    db.commit()
    print("Reset complete.")


def seed_user(db: Session):
    existing = db.query(User).filter(User.id == DEMO_USER_ID).first()
    if existing:
        return existing
    user = User(
        id=DEMO_USER_ID,
        email="demo@ottofii.com",
        org_id=DEMO_ORG_ID,
        role="cfo",
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.commit()
    print(f"Created user: {user.email}")
    return user


def seed_connection(db: Session, source: str) -> str:
    connection_id = f"conn_{source}_{uuid.uuid4().hex[:8]}"
    conn = Connection(
        id=connection_id,
        user_id=DEMO_USER_ID,
        org_id=DEMO_ORG_ID,
        type=source,
        status="active",
        last_synced=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(conn)
    db.commit()
    return connection_id


def seed_streams(db: Session, source_filter: str = None) -> int:
    streams = RECURRING_STREAMS
    if source_filter and source_filter != "demo":
        streams = [s for s in RECURRING_STREAMS if s["source"] == source_filter]

    count = 0
    for data in streams:
        existing = db.query(RecurringStream).filter(RecurringStream.id == data["id"]).first()
        if existing:
            continue
        stream = RecurringStream(
            id=data["id"],
            org_id=data["org_id"],
            merchant=data["merchant"],
            raw_merchant=data["raw_merchant"],
            category=data["category"],
            cadence=data["cadence"],
            amount_usd=data["amount_usd"],
            seat_count=data.get("seat_count"),
            usage_signal=data["usage_signal"],
            confidence=data["confidence"],
            is_protected=data["is_protected"],
            notes=data.get("notes"),
            first_seen=data["first_seen"],
            last_seen=data["last_seen"],
            occurrence_count=data["occurrence_count"],
            source=data["source"],
            created_at=datetime.utcnow(),
        )
        db.add(stream)
        count += 1

    db.commit()
    return count


def main(reset: bool = False):
    db = SessionLocal()
    try:
        if reset:
            reset_db(db)

        seed_user(db)
        seed_connection(db, "demo")
        count = seed_streams(db)
        print(f"Seeded {count} recurring streams.")
    finally:
        db.close()


if __name__ == "__main__":
    reset = "--reset" in sys.argv
    main(reset=reset)
