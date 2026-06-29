import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, DateTime, Numeric, Integer,
    ForeignKey, Text, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import ARRAY
import enum
from database import Base


def gen_id():
    return str(uuid.uuid4())


class IntentType(str, enum.Enum):
    SEEKING_SERVICE = "seeking_service"
    SEEKING_MATERIAL = "seeking_material"
    OFFERING_SERVICE = "offering_service"
    SEEKING_JOB = "seeking_job"


class EntryType(str, enum.Enum):
    ON_DEMAND = "on_demand"
    PROJECT = "project"


class EntryStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"
    MATCHED = "matched"
    BOOKED = "booked"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class ProposalStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"


class BookingStatus(str, enum.Enum):
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    DISPUTED = "disputed"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    region = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    provider_profile = relationship("ProviderProfile", back_populates="user", uselist=False)
    entries = relationship("Entry", back_populates="client", foreign_keys="Entry.client_id")
    proposals = relationship("Proposal", back_populates="provider")
    bookings_as_client = relationship("Booking", back_populates="client", foreign_keys="Booking.client_id")
    bookings_as_provider = relationship("Booking", back_populates="provider", foreign_keys="Booking.provider_id")
    reviews_from = relationship("Review", back_populates="from_user", foreign_keys="Review.from_user_id")
    reviews_to = relationship("Review", back_populates="to_user", foreign_keys="Review.to_user_id")
    messages = relationship("Message", back_populates="sender")
    projects = relationship("Project", back_populates="user")


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    skills = Column(ARRAY(String), default=[])
    availability = Column(JSON, nullable=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    rating = Column(Numeric(3, 2), default=0)
    jobs_completed = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="provider_profile")


class Entry(Base):
    __tablename__ = "entries"

    id = Column(String, primary_key=True, default=gen_id)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    intent_type = Column(SAEnum(IntentType), nullable=False, default=IntentType.SEEKING_SERVICE)
    entry_type = Column(SAEnum(EntryType), nullable=False, default=EntryType.ON_DEMAND)
    status = Column(SAEnum(EntryStatus), nullable=False, default=EntryStatus.DRAFT)
    category = Column(String, nullable=True)
    city = Column(String, nullable=True)
    region = Column(String, nullable=True)
    budget_min = Column(Numeric(10, 2), nullable=True)
    budget_max = Column(Numeric(10, 2), nullable=True)
    scheduled_date = Column(DateTime, nullable=True)
    scheduled_time = Column(String, nullable=True)
    ai_estimate_min = Column(Numeric(10, 2), nullable=True)
    ai_estimate_max = Column(Numeric(10, 2), nullable=True)
    ai_category = Column(String, nullable=True)
    ai_urgency = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("User", back_populates="entries", foreign_keys=[client_id])
    proposals = relationship("Proposal", back_populates="entry")
    bookings = relationship("Booking", back_populates="entry")


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    desc = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    tasks = relationship("ProjectTask", back_populates="project", cascade="all, delete-orphan", order_by="ProjectTask.order")


class ProjectTask(Base):
    __tablename__ = "project_tasks"

    id = Column(String, primary_key=True, default=gen_id)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    done = Column(Boolean, default=False)
    order = Column(Integer, default=0)
    entry_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="tasks")


class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(String, primary_key=True, default=gen_id)
    entry_id = Column(String, ForeignKey("entries.id"), nullable=False)
    provider_id = Column(String, ForeignKey("users.id"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    message = Column(Text, nullable=True)
    status = Column(SAEnum(ProposalStatus), default=ProposalStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    entry = relationship("Entry", back_populates="proposals")
    provider = relationship("User", back_populates="proposals")
    booking = relationship("Booking", back_populates="proposal", uselist=False)


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=gen_id)
    entry_id = Column(String, ForeignKey("entries.id"), nullable=False)
    proposal_id = Column(String, ForeignKey("proposals.id"), unique=True, nullable=False)
    client_id = Column(String, ForeignKey("users.id"), nullable=False)
    provider_id = Column(String, ForeignKey("users.id"), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    trust_fee = Column(Numeric(10, 2), nullable=False)
    platform_fee = Column(Numeric(10, 2), nullable=False)
    provider_payout = Column(Numeric(10, 2), nullable=False)
    status = Column(SAEnum(BookingStatus), default=BookingStatus.CONFIRMED)
    stripe_payment_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    entry = relationship("Entry", back_populates="bookings")
    proposal = relationship("Proposal", back_populates="booking")
    client = relationship("User", back_populates="bookings_as_client", foreign_keys=[client_id])
    provider = relationship("User", back_populates="bookings_as_provider", foreign_keys=[provider_id])
    reviews = relationship("Review", back_populates="booking")
    messages = relationship("Message", back_populates="booking", order_by="Message.created_at")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=gen_id)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False)
    from_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    to_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="reviews")
    from_user = relationship("User", back_populates="reviews_from", foreign_keys=[from_user_id])
    to_user = relationship("User", back_populates="reviews_to", foreign_keys=[to_user_id])


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=gen_id)
    booking_id = Column(String, ForeignKey("bookings.id"), nullable=False)
    sender_id = Column(String, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)

    booking = relationship("Booking", back_populates="messages")
    sender = relationship("User", back_populates="messages")
