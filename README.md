# OTaska

AI-native marketplace for construction services in Central/Eastern Europe.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Python FastAPI + SQLAlchemy + PostgreSQL
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`)
- **Auth:** JWT Bearer tokens
- **Payments:** Stripe (escrow model)

## Quick Start

### 1. Backend

```bash
cd backend

# Create virtual env
python3 -m venv .venv
source .venv/bin/activate

# Install deps
pip install -r requirements.txt

# Configure env
cp .env.example .env
# Edit .env — set DATABASE_URL and ANTHROPIC_API_KEY

# Run (auto-creates DB tables on start)
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend

npm install
npm run dev
```

App: http://localhost:5173

### 3. PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb otaska
```

## Architecture

```
otaska/
├── backend/
│   ├── main.py           # FastAPI app + CORS + router registration
│   ├── models.py         # SQLAlchemy ORM models
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── database.py       # DB engine + session
│   ├── config.py         # Settings (pydantic-settings)
│   ├── services/
│   │   ├── ai_service.py   # Claude API: categorize, estimate, match
│   │   └── auth_service.py # JWT + bcrypt
│   └── routers/
│       ├── auth.py, entries.py, browse.py
│       ├── proposals.py, bookings.py
│       ├── projects.py, profile.py
│       ├── messages.py, ai.py
└── frontend/
    └── src/
        ├── App.tsx         # React Router setup
        ├── pages/          # Dashboard, Browse, NewEntry, EntryDetail, Profile...
        ├── components/     # EntryCard, TabBar, Logo, IntentBadge...
        ├── store/          # Zustand auth store
        └── lib/api.ts      # Axios API client
```

## AI Features

- **Auto-categorize** — as you type, Claude reads the entry and suggests category + urgency
- **Cost estimate** — instant price range based on CEE construction market knowledge
- **Provider matching** — Claude ranks providers by relevance to the entry

## Monetization

- 5% Trust & Safety fee from client (at booking)
- 12% platform commission from provider (at completion)
- €4.99 PDF AI estimate (Phase 2)
