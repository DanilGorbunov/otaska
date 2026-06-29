from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field
from models import IntentType, EntryType, EntryStatus, ProposalStatus, BookingStatus


# ─── Auth ────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6)
    city: Optional[str] = None
    first_task: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── User ─────────────────────────────────────────────────────────────────────

class ProviderProfileOut(BaseModel):
    id: str
    bio: Optional[str]
    skills: List[str] = []
    hourly_rate: Optional[Decimal]
    rating: Decimal
    jobs_completed: int
    verified: bool

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str]
    city: Optional[str]
    region: Optional[str]
    avatar_url: Optional[str]
    verified: bool
    created_at: datetime
    provider_profile: Optional[ProviderProfileOut] = None

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    hourly_rate: Optional[Decimal] = None
    availability: Optional[dict] = None


# ─── Entry ────────────────────────────────────────────────────────────────────

class EntryCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = None
    intent_type: IntentType = IntentType.SEEKING_SERVICE
    entry_type: EntryType = EntryType.ON_DEMAND
    category: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    scheduled_date: Optional[datetime] = None
    scheduled_time: Optional[str] = None


class EntryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    intent_type: Optional[IntentType] = None
    entry_type: Optional[EntryType] = None
    category: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    budget_min: Optional[Decimal] = None
    budget_max: Optional[Decimal] = None
    scheduled_date: Optional[datetime] = None
    scheduled_time: Optional[str] = None


class EntryOut(BaseModel):
    id: str
    client_id: str
    title: str
    description: Optional[str]
    intent_type: IntentType
    entry_type: EntryType
    status: EntryStatus
    category: Optional[str]
    city: Optional[str]
    region: Optional[str]
    budget_min: Optional[Decimal]
    budget_max: Optional[Decimal]
    scheduled_date: Optional[datetime]
    scheduled_time: Optional[str]
    ai_estimate_min: Optional[Decimal]
    ai_estimate_max: Optional[Decimal]
    ai_category: Optional[str]
    ai_urgency: Optional[str]
    created_at: datetime
    proposal_count: Optional[int] = 0
    client: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Project ──────────────────────────────────────────────────────────────────

class ProjectTaskCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    order: int = 0


class ProjectTaskUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None
    order: Optional[int] = None


class ProjectTaskOut(BaseModel):
    id: str
    project_id: str
    title: str
    done: bool
    order: int
    entry_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    desc: Optional[str] = None
    category: Optional[str] = None


class ProjectOut(BaseModel):
    id: str
    user_id: str
    title: str
    desc: Optional[str]
    category: Optional[str]
    tasks: List[ProjectTaskOut] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Proposal ─────────────────────────────────────────────────────────────────

class ProposalCreate(BaseModel):
    entry_id: str
    price: Decimal = Field(gt=0)
    message: Optional[str] = None


class ProposalOut(BaseModel):
    id: str
    entry_id: str
    provider_id: str
    price: Decimal
    message: Optional[str]
    status: ProposalStatus
    created_at: datetime
    provider: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Booking ──────────────────────────────────────────────────────────────────

class BookingOut(BaseModel):
    id: str
    entry_id: str
    client_id: str
    provider_id: str
    price: Decimal
    trust_fee: Decimal
    platform_fee: Decimal
    provider_payout: Decimal
    status: BookingStatus
    created_at: datetime
    completed_at: Optional[datetime]
    client: Optional[UserOut] = None
    provider: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── Review ───────────────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    booking_id: str
    to_user_id: str
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    id: str
    booking_id: str
    from_user_id: str
    to_user_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Message ──────────────────────────────────────────────────────────────────

class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: str
    booking_id: str
    sender_id: str
    content: str
    created_at: datetime
    read_at: Optional[datetime]
    sender: Optional[UserOut] = None

    class Config:
        from_attributes = True


# ─── AI ───────────────────────────────────────────────────────────────────────

class AICategorizeRequest(BaseModel):
    text: str
    city: Optional[str] = "Bratislava"


class AICategorizeResponse(BaseModel):
    intent_type: str
    category: str
    entry_type: str
    urgency: str
    title: str
    skills: List[str]


class AIEstimateRequest(BaseModel):
    text: str
    city: Optional[str] = "Bratislava"


class AIEstimateResponse(BaseModel):
    min: Decimal
    max: Decimal
    currency: str
    duration: str
    basis: str


# ─── Generic ──────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    error: str


class SuccessResponse(BaseModel):
    message: str
