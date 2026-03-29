"""
POST /connect/mock
Owner: Person 2
Called by: Person 1 (frontend connector screen)
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Connection
from schemas import ConnectRequest, ConnectResponse
from seed import seed_streams, seed_user
from seed_data import DEMO_USER_ID

router = APIRouter()

VALID_SOURCES = {"bank", "gmail", "slack", "csv", "demo"}


@router.post("/connect/mock", response_model=ConnectResponse)
def connect_mock(request: ConnectRequest, db: Session = Depends(get_db)):
    if request.source not in VALID_SOURCES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid source '{request.source}'. Must be one of: {sorted(VALID_SOURCES)}",
        )

    # Ensure demo user exists
    seed_user(db)

    # Create connection record
    connection_id = f"conn_{request.source}_{uuid.uuid4().hex[:8]}"
    conn = Connection(
        id=connection_id,
        user_id=DEMO_USER_ID,
        org_id="org_demo",
        type=request.source,
        status="active",
        last_synced=datetime.utcnow(),
        created_at=datetime.utcnow(),
    )
    db.add(conn)
    db.commit()

    # Load streams for this source (demo loads all 12)
    streams_loaded = seed_streams(db, source_filter=request.source)

    return ConnectResponse(
        connection_id=connection_id,
        streams_loaded=streams_loaded,
    )
