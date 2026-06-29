from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import hash_password, verify_password, create_token, get_current_user
from models import IntentType, EntryStatus

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=schemas.TokenResponse)
def register(body: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = models.User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        city=body.city,
    )
    db.add(user)
    db.flush()

    db.add(models.ProviderProfile(user_id=user.id))

    if body.first_task:
        db.add(models.Entry(
            client_id=user.id,
            title=body.first_task[:200],
            intent_type=IntentType.SEEKING_SERVICE,
            status=EntryStatus.OPEN,
            city=body.city,
        ))

    db.commit()
    return {"access_token": create_token(user.id)}


@router.post("/login", response_model=schemas.TokenResponse)
def login(body: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_token(user.id)}


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user
