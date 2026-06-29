from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import get_current_user
from config import PLATFORM_COMMISSION, TRUST_FEE

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", response_model=schemas.BookingOut, status_code=201)
def accept_proposal(proposal_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    proposal = db.query(models.Proposal).filter(
        models.Proposal.id == proposal_id,
        models.Proposal.status == models.ProposalStatus.PENDING,
    ).first()
    if not proposal:
        raise HTTPException(404, "Proposal not found")
    if proposal.entry.client_id != user.id:
        raise HTTPException(403, "Not your entry")

    price = float(proposal.price)
    trust_fee = round(price * TRUST_FEE, 2)
    platform_fee = round(price * PLATFORM_COMMISSION, 2)
    provider_payout = round(price - platform_fee, 2)

    booking = models.Booking(
        entry_id=proposal.entry_id,
        proposal_id=proposal.id,
        client_id=user.id,
        provider_id=proposal.provider_id,
        price=price,
        trust_fee=trust_fee,
        platform_fee=platform_fee,
        provider_payout=provider_payout,
    )
    db.add(booking)

    proposal.status = models.ProposalStatus.ACCEPTED
    proposal.entry.status = models.EntryStatus.BOOKED

    # reject other proposals
    for p in proposal.entry.proposals:
        if p.id != proposal.id and p.status == models.ProposalStatus.PENDING:
            p.status = models.ProposalStatus.REJECTED

    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/complete", response_model=schemas.BookingOut)
def complete_booking(booking_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.client_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.status == models.BookingStatus.COMPLETED:
        raise HTTPException(400, "Already completed")

    booking.status = models.BookingStatus.COMPLETED
    booking.completed_at = datetime.utcnow()
    booking.entry.status = models.EntryStatus.DONE

    provider_profile = db.query(models.ProviderProfile).filter(
        models.ProviderProfile.user_id == booking.provider_id
    ).first()
    if provider_profile:
        provider_profile.jobs_completed += 1

    db.commit()
    db.refresh(booking)
    return booking


@router.post("/{booking_id}/dispute", response_model=schemas.BookingOut)
def dispute_booking(booking_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    booking = db.query(models.Booking).filter(
        models.Booking.id == booking_id,
        models.Booking.client_id == user.id,
    ).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    booking.status = models.BookingStatus.DISPUTED
    db.commit()
    db.refresh(booking)
    return booking
