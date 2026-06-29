from fastapi import APIRouter, HTTPException
import schemas
from services import ai_service

router = APIRouter(prefix="/api/public", tags=["public"])


@router.post("/categorize", response_model=schemas.AICategorizeResponse)
async def categorize_public(body: schemas.AICategorizeRequest):
    """No auth required — used by the landing page flow."""
    try:
        result = await ai_service.categorize_entry(body.text, body.city or "Bratislava")
        return result
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")


@router.post("/estimate", response_model=schemas.AIEstimateResponse)
async def estimate_public(body: schemas.AIEstimateRequest):
    """No auth required — used by the landing page flow."""
    try:
        result = await ai_service.estimate_cost(body.text, body.city or "Bratislava")
        return result
    except Exception as e:
        raise HTTPException(500, f"AI error: {str(e)}")
