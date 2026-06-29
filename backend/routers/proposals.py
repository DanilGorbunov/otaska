from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/proposals", tags=["proposals"])


@router.post("", response_model=schemas.ProposalOut, status_code=201)
def submit_proposal(body: schemas.ProposalCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = db.query(models.Entry).filter(
        models.Entry.id == body.entry_id,
        models.Entry.status == models.EntryStatus.OPEN,
    ).first()
    if not entry:
        raise HTTPException(404, "Entry not found or not open")
    if entry.client_id == user.id:
        raise HTTPException(400, "Cannot propose on own entry")

    existing = db.query(models.Proposal).filter(
        models.Proposal.entry_id == body.entry_id,
        models.Proposal.provider_id == user.id,
    ).first()
    if existing:
        raise HTTPException(400, "Already submitted a proposal")

    proposal = models.Proposal(
        entry_id=body.entry_id,
        provider_id=user.id,
        price=body.price,
        message=body.message,
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal


@router.delete("/{proposal_id}", response_model=schemas.SuccessResponse)
def withdraw_proposal(proposal_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    proposal = db.query(models.Proposal).filter(
        models.Proposal.id == proposal_id,
        models.Proposal.provider_id == user.id,
        models.Proposal.status == models.ProposalStatus.PENDING,
    ).first()
    if not proposal:
        raise HTTPException(404, "Proposal not found")
    db.delete(proposal)
    db.commit()
    return {"message": "Withdrawn"}
