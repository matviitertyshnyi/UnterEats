# UnterEats — Local Business Delivery & AI Dispatch

**UnterEats** is a full-stack local-business last-mile delivery & dispatch MVP (inspired by UberEats/Glovo, built for neighborhood shops like pizzerias, flower shops, bakeries, and pharmacies).

> **Demo Video**: *(Add your `demo.gif` or `demo.mp4` here before submitting)*

---

## Features

- **Delivery Order Management (CRUD)**: Create, filter by status, assign couriers inline, advance order lifecycle (`pending` → `assigned` → `in_transit` → `delivered`), and delete orders.
- **Local Shops & Courier Fleet**: Pre-seeded neighborhood businesses and couriers (`foot`, `ebike`, `cargo_bike`, `scooter`, `car`), plus live courier online/offline toggling and shop registration.
- **Creative Twist — AI Dispatch Assistant**:
  - Describe a delivery in plain English (e.g., *"2 fragile flower bouquets, 3.2 km, heavy rain"*).
  - Returns the optimal transport mode, matched online courier, estimated ETA, CO₂ saved vs. a car baseline (170 g/km), and concise reasoning — plus one-click **Apply to New Order Form**.
  - Uses OpenAI (`OPENAI_API_KEY`) when configured, with a **deterministic smart fallback** so the app works 100% offline/out-of-the-box with zero API keys.

---

## Tech Stack & Architecture

Monorepo managed with **npm workspaces**:

- **Backend (`packages/backend`)**: Node.js, TypeScript, Express, Zod validation, CORS, and SQLite (`sql.js` — zero native build steps or external DB server).
  - Layered structure: `routes/` → `controllers/` → `services/` → `repositories/` → `db/`.
  - AI system prompt in `packages/backend/src/prompts/dispatchPrompt.ts`.
- **Frontend (`packages/frontend`)**: React 19, Vite, TypeScript, Tailwind CSS v4, `lucide-react`.
- **Tests**: Vitest + Supertest (backend API & AI fallback tests) and Vitest + Testing Library (frontend).
- **AI Tooling & Specs**:
  - `AGENTS.md` & `CLAUDE.md` (shared engineering rules for Codex, Claude Code, and Antigravity).
  - `.agents/skills/` & `.claude/skills/` (`api-conventions`, `frontend-ui`, `ai-dispatch-agent`).
  - `specs/` (`mvp-spec.md`, `ai-dispatch-agent.md`), `PRODUCT.md`, and `DESIGN.md`.

---

## Running Locally

### Prerequisites
- Node.js **20+** and npm **10+**

### 1. Install dependencies (from repository root)
```bash
npm install
```

### 2. Optional environment configuration
```bash
cp .env.example .env
```
*(Works without `.env` — defaults to port `3001` for API, `5173` for frontend, SQLite file in `packages/backend/data/untereats.sqlite`, and AI fallback mode.)*

### 3. Run both API and Frontend
```bash
npm run dev
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:3001/api` (health check: `GET /api/health`)

Or run them separately:
```bash
npm run dev --workspace=@untereats/backend
npm run dev --workspace=@untereats/frontend
```

### 4. Run tests & typecheck
```bash
npm test
npm run typecheck
```

---

## How AI Tools Were Used

- **Antigravity (Gemini)** was used to architect the monorepo, scaffold the layered Express + SQLite backend, design the React + Tailwind dispatch UI (`impeccable` design workflow in `DESIGN.md`), and write integration/UI tests.
- Project-level agent instructions (`AGENTS.md`, `CLAUDE.md`), feature specs (`specs/`), and domain skills (`.agents/skills/`, `.claude/skills/`) are committed to the repo so any coding agent (Codex, Claude Code, Antigravity) follows consistent conventions.
