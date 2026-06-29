from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/entries", tags=["entries"])


def entry_with_count(entry: models.Entry, db: Session) -> schemas.EntryOut:
    count = len(entry.proposals)
    out = schemas.EntryOut.model_validate(entry)
    out.proposal_count = count
    return out


@router.get("", response_model=list[schemas.EntryOut])
def my_entries(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entries = db.query(models.Entry).filter(models.Entry.client_id == user.id).order_by(models.Entry.created_at.desc()).all()
    return [entry_with_count(e, db) for e in entries]


@router.post("", response_model=schemas.EntryOut, status_code=201)
def create_entry(body: schemas.EntryCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = models.Entry(client_id=user.id, **body.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry_with_count(entry, db)


@router.put("/{entry_id}", response_model=schemas.EntryOut)
def update_entry(entry_id: str, body: schemas.EntryUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id, models.Entry.client_id == user.id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(entry, k, v)
    db.commit()
    db.refresh(entry)
    return entry_with_count(entry, db)


@router.post("/{entry_id}/publish", response_model=schemas.EntryOut)
def publish_entry(entry_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id, models.Entry.client_id == user.id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    entry.status = models.EntryStatus.OPEN
    db.commit()
    db.refresh(entry)
    return entry_with_count(entry, db)


@router.delete("/{entry_id}", response_model=schemas.SuccessResponse)
def delete_entry(entry_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id, models.Entry.client_id == user.id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    db.delete(entry)
    db.commit()
    return {"message": "Deleted"}


@router.get("/{entry_id}/proposals", response_model=list[schemas.ProposalOut])
def entry_proposals(entry_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id, models.Entry.client_id == user.id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    return entry.proposals
