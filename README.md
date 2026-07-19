# Taskont

AI-native marketplace for everyday services — post a task, get matched, get it done.

## Stack

- **Frontend:** React + TypeScript + Vite, PWA
- **Backend:** Convex (reactive database + serverless functions), no separate API server
- **Auth:** Convex Auth (email + password)
- **AI:** OpenAI `gpt-4o-mini` — conversational task intake, photo diagnosis, project breakdown
- **Payments:** not yet live — `mockPay` stands in for Stripe Connect escrow (see `convex/config.ts`)
- **i18n:** English default, Ukrainian toggle on the landing page; `en`/`uk` locale files under `frontend/src/locales`

## Quick Start

```bash
cd frontend
npm install

# Terminal 1 — Convex backend (schema + functions), also regenerates types on save
npx convex dev

# Terminal 2 — frontend dev server
npm run dev
```

App: http://localhost:5173 (or whichever port Vite picks)

Convex env vars needed (set via `npx convex dashboard` → Settings → Environment Variables):
- `OPENAI_API_KEY`

## Architecture

```
otaska/
└── frontend/
    ├── convex/              # backend — schema, queries, mutations, actions
    │   ├── schema.ts        # all tables
    │   ├── entries.ts       # tasks/listings CRUD + feed
    │   ├── proposals.ts     # bids, accept, markDone, dispute, requote
    │   ├── reviews.ts       # two-way ratings (client↔provider)
    │   ├── messages.ts      # chat, contact-info soft warning
    │   ├── users.ts         # profiles, performer discoverability
    │   ├── ai.ts             # OpenAI-backed actions (chat, diagnosePhoto, matching)
    │   └── config.ts        # platform constants (commission rate)
    └── src/
        ├── pages/           # Landing, Dashboard, Browse, NewEntry, EntryDetail, Profile, Chat...
        ├── components/      # layout (AppShell, TabBar, Sidebar), shared UI
        ├── lib/             # categories, i18n setup
        └── locales/         # en/, uk/ translation files
```

## Product model

- **No client/performer toggle.** Anyone can post a task or take one. A profile becomes discoverable as a performer automatically once it has at least one skill filled in (`convex/users.ts:updateProfile`).
- **Commission:** 12% from the performer's payout only — the client never pays more than the price they agreed to. Constant lives in `convex/config.ts`.
- **Booking lifecycle:** `pending → in_progress → done → paid`, with `disputed` as a branch off `done` and a 60-hour auto-confirm if the client never responds (`convex/proposals.ts`).

## Known gaps

- Payments are mocked (`proposals.mockPay`) — real Stripe Connect escrow is scaffolded but not wired to live keys.
- No automated tests yet; `vercel-build` should run `tsc` before `vite build`.
