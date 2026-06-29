import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from database import Base, engine
import models  # noqa: F401 — registers all models with Base
from routers import auth, entries, browse, proposals, bookings, projects, profile, messages, ai, gpt, public

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OTaska API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(entries.router)
app.include_router(browse.router)
app.include_router(proposals.router)
app.include_router(bookings.router)
app.include_router(projects.router)
app.include_router(profile.router)
app.include_router(messages.router)
app.include_router(ai.router)
app.include_router(gpt.router)
app.include_router(public.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "OTaska API"}
