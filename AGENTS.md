# AGENTS.md — UnterEats Engineering Guide

## Project Overview
UnterEats is a full-stack local-business last-mile delivery & AI dispatch MVP (monorepo with `packages/backend` and `packages/frontend`).

## Repository Structure
- `packages/backend` (`@untereats/backend`): Express + TypeScript + SQLite REST API + AI Dispatch Agent.
- `packages/frontend` (`@untereats/frontend`): React + Vite + TypeScript + Tailwind CSS dispatch dashboard.
- `specs/`: Product, API, and AI agent specifications.
- `PRODUCT.md` / `DESIGN.md`: Product context and UI design system.
- `.agents/skills/` & `.claude/skills/`: Domain skills (mirrored for Codex and Claude).

## Root Commands
- `npm install` — Install all workspace dependencies.
- `npm run dev` — Run backend (`:3001`) and frontend (`:5173`) concurrently.
- `npm test` — Run backend and frontend test suites.
- `npm run typecheck` — TypeScript check across all workspaces.
- `npm run build` — Build both packages.

## Coding Standards
- **Keep it lean (YAGNI)**: Smallest clean solution; no speculative abstractions.
- **Backend layering**: `routes/` -> `controllers/` -> `services/` -> `repositories/` -> SQLite. Never put SQL in routes/controllers.
- **Validation**: Validate all request bodies and params with `zod` at the boundary.
- **Frontend**: Typed API client in `src/api/`; follow `DESIGN.md` for all visual tokens, spacing, and states (loading, empty, error).
- **AI Dispatch Agent**: System prompt lives in `packages/backend/src/prompts/dispatchPrompt.ts`. Must always return structured JSON and support deterministic fallback when `OPENAI_API_KEY` is unset.

## Git Workflow
- `main` is protected. Never commit directly to `main`.
- Create feature branches (`feat/...`, `fix/...`) and merge via Pull Requests.
