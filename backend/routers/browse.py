from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models
import schemas
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/browse", tags=["browse"])


@router.get("/entries", response_model=list[schemas.EntryOut])
def browse_entries(
    region: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    intent_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    q = db.query(models.Entry).filter(
        models.Entry.status == models.EntryStatus.OPEN,
        models.Entry.client_id != user.id,
    )
    if region:
        q = q.filter(models.Entry.region.ilike(f"%{region}%"))
    if category:
        q = q.filter(models.Entry.category == category)
    if intent_type:
        q = q.filter(models.Entry.intent_type == intent_type)
    if search:
        q = q.filter(models.Entry.title.ilike(f"%{search}%"))

    entries = q.order_by(models.Entry.created_at.desc()).limit(50).all()
    result = []
    for e in entries:
        out = schemas.EntryOut.model_validate(e)
        out.proposal_count = len(e.proposals)
        result.append(out)
    return result


@router.get("/entries/{entry_id}", response_model=schemas.EntryOut)
def browse_entry_detail(entry_id: str, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    from fastapi import HTTPException
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    out = schemas.EntryOut.model_validate(entry)
    out.proposal_count = len(entry.proposals)
    return out
