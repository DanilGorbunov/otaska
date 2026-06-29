from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
import models
import schemas
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/{user_id}", response_model=schemas.UserOut)
def get_profile(user_id: str, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.put("", response_model=schemas.UserOut)
def update_profile(body: schemas.ProfileUpdate, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    user_fields = {"name", "phone", "city", "region"}
    profile_fields = {"bio", "skills", "hourly_rate", "availability"}

    for k, v in body.model_dump(exclude_none=True).items():
        if k in user_fields:
            setattr(user, k, v)
        elif k in profile_fields:
            if not user.provider_profile:
                db.add(models.ProviderProfile(user_id=user.id))
                db.flush()
                db.refresh(user)
            setattr(user.provider_profile, k, v)

    db.commit()
    db.refresh(user)
    return user
