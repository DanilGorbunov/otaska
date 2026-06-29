from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/messages", tags=["messages"])


def _check_booking_access(booking_id: str, user: models.User, db: Session) -> models.Booking:
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(404, "Booking not found")
    if booking.client_id != user.id and booking.provider_id != user.id:
        raise HTTPException(403, "No access")
    return booking


@router.get("/{booking_id}", response_model=list[schemas.MessageOut])
def get_messages(booking_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    booking = _check_booking_access(booking_id, user, db)

    # mark messages as read
    for msg in booking.messages:
        if msg.sender_id != user.id and not msg.read_at:
            msg.read_at = datetime.utcnow()
    db.commit()

    return booking.messages


@router.post("/{booking_id}", response_model=schemas.MessageOut, status_code=201)
def send_message(booking_id: str, body: schemas.MessageCreate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    _check_booking_access(booking_id, user, db)
    msg = models.Message(booking_id=booking_id, sender_id=user.id, content=body.content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
