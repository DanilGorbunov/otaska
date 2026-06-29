from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
import schemas
import models
from services.auth_service import get_current_user
from services import ai_service

router = APIRouter(prefix="/api/ai", tags=["ai"])

# complementary intent: if user seeks X, find people who offer X
_COMPLEMENTARY = {
    "seeking_service": "offering_service",
    "offering_service": "seeking_service",
    "seeking_material": "offering_material",
    "offering_material": "seeking_material",
    "seeking_job": "seeking_service",
}


class LiveMatchRequest(BaseModel):
    text: str
    city: Optional[str] = None


@router.post("/categorize", response_model=schemas.AICategorizeResponse)
async def categorize(body: schemas.AICategorizeRequest, _: models.User = Depends(get_current_user)):
    try:
        result = await ai_service.categorize_entry(body.text, body.city or "Bratislava")
        return result
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")


@router.post("/estimate", response_model=schemas.AIEstimateResponse)
async def estimate(body: schemas.AIEstimateRequest, _: models.User = Depends(get_current_user)):
    try:
        result = await ai_service.estimate_cost(body.text, body.city or "Bratislava")
        return result
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")


@router.post("/live-match")
async def live_match(body: LiveMatchRequest, db: Session = Depends(get_db), _: models.User = Depends(get_current_user)):
    """
    Core AI Agent endpoint.
    Takes raw user text → categorizes → immediately finds real matching entries in DB.
    Returns both AI analysis and live database matches.
    """
    try:
        ai_result = await ai_service.categorize_entry(body.text, body.city or "Bratislava")
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")

    intent = ai_result.get("intent_type", "seeking_service")
    category = ai_result.get("category")
    target_intent = _COMPLEMENTARY.get(intent, "offering_service")

    # query live entries from DB
    q = db.query(models.Entry).filter(
        models.Entry.intent_type == target_intent,
        models.Entry.status == models.EntryStatus.OPEN,
    )
    if category and category != "other":
        q = q.filter(models.Entry.category == category)
    if body.city:
        q = q.filter(models.Entry.city.ilike(f"%{body.city}%"))

    matches = q.order_by(models.Entry.created_at.desc()).limit(8).all()

    # also search by user profiles (provider profiles)
    provider_q = db.query(models.User).join(
        models.ProviderProfile, models.User.id == models.ProviderProfile.user_id
    ).filter(models.ProviderProfile.skills != None)

    providers = []
    if category and category != "other":
        all_providers = provider_q.limit(30).all()
        for p in all_providers:
            skills = [s.lower() for s in (p.provider_profile.skills or [])]
            if any(category.lower() in s or s in category.lower() for s in skills):
                providers.append(p)
    providers = providers[:5]

    match_entries = []
    for e in matches:
        out = schemas.EntryOut.model_validate(e)
        out.proposal_count = len(e.proposals)
        match_entries.append(out)

    provider_out = []
    for p in providers:
        provider_out.append({
            "id": p.id,
            "name": p.name,
            "city": p.city,
            "rating": float(p.provider_profile.rating) if p.provider_profile else 0,
            "jobs_completed": p.provider_profile.jobs_completed if p.provider_profile else 0,
            "skills": p.provider_profile.skills if p.provider_profile else [],
            "hourly_rate": float(p.provider_profile.hourly_rate) if p.provider_profile and p.provider_profile.hourly_rate else None,
        })

    return {
        "ai": ai_result,
        "entry_matches": [e.model_dump() for e in match_entries],
        "provider_matches": provider_out,
        "total": len(match_entries) + len(provider_out),
    }


@router.post("/match")
async def match(entry_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    entry = db.query(models.Entry).filter(models.Entry.id == entry_id, models.Entry.client_id == user.id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")

    providers = db.query(models.ProviderProfile).all()
    provider_list = [
        {"id": p.user_id, "skills": p.skills or [], "city": p.user.city, "rating": float(p.rating)}
        for p in providers
    ]
    entry_dict = {
        "id": entry.id,
        "title": entry.title,
        "category": entry.category,
        "city": entry.city,
        "intent_type": entry.intent_type.value,
    }
    try:
        ordered_ids = await ai_service.match_providers(entry_dict, provider_list)
        return {"provider_ids": ordered_ids}
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")
