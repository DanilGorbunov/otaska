from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
import models
from services.auth_service import get_current_user
from services import gpt_service

router = APIRouter(prefix="/api/gpt", tags=["gpt"])


class AssistantRequest(BaseModel):
    message: str


class EnhanceRequest(BaseModel):
    title: str
    category: str = "other"


class NegotiationRequest(BaseModel):
    entry_id: str


@router.post("/assistant")
async def assistant(
    body: AssistantRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """GPT-4 project management assistant with user context."""
    active = db.query(models.Entry).filter(
        models.Entry.client_id == user.id,
        models.Entry.status.in_(["open", "matched", "booked", "in_progress"]),
    ).count()
    projects = db.query(models.Project).filter(models.Project.user_id == user.id).count()

    try:
        reply = await gpt_service.project_assistant(
            body.message,
            context={"name": user.name, "city": user.city or "Bratislava", "active_entries": active, "projects": projects},
        )
        return {"reply": reply}
    except Exception as e:
        raise HTTPException(500, f"GPT error: {str(e)}")


@router.post("/enhance-description")
async def enhance_description(
    body: EnhanceRequest,
    user: models.User = Depends(get_current_user),
):
    """GPT generates a professional description for an entry."""
    try:
        desc = await gpt_service.smart_description_enhance(
            body.title, body.category, user.city or "Bratislava"
        )
        return {"description": desc}
    except Exception as e:
        raise HTTPException(500, f"GPT error: {str(e)}")


@router.post("/negotiate")
async def negotiate(
    body: NegotiationRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """GPT analyzes proposals and advises best value pick."""
    entry = db.query(models.Entry).filter(
        models.Entry.id == body.entry_id, models.Entry.client_id == user.id
    ).first()
    if not entry:
        raise HTTPException(404, "Entry not found")

    proposals_data = [
        {
            "id": p.id,
            "price": float(p.price),
            "message": p.message,
            "provider_name": p.provider.name if p.provider else "Unknown",
            "provider_rating": float(p.provider.provider_profile.rating) if p.provider and p.provider.provider_profile else 0,
            "jobs_done": p.provider.provider_profile.jobs_completed if p.provider and p.provider.provider_profile else 0,
        }
        for p in entry.proposals if p.status == "pending"
    ]

    if not proposals_data:
        raise HTTPException(400, "No pending proposals")

    try:
        advice = await gpt_service.price_negotiation_advice(
            entry.title, proposals_data, user.city or "Bratislava"
        )
        return advice
    except Exception as e:
        raise HTTPException(500, f"GPT error: {str(e)}")
