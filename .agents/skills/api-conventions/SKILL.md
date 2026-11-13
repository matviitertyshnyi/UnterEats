---
name: api-conventions
description: Backend REST API, layered architecture, Zod validation, and SQLite conventions for UnterEats.
---

# API Conventions

- **Layering**: `routes/*.ts` -> `controllers/*.ts` -> `services/*.ts` -> `repositories/*.ts`.
  - Routes only bind HTTP paths and middleware.
  - Controllers parse/validate inputs with `zod` and return HTTP status codes (`200`, `201`, `400`, `404`, `500`).
  - Services contain business logic (ETA calculation, CO₂ savings, courier matching, AI dispatch).
  - Repositories execute parameterized SQLite queries only.
- **CORS**: Enabled via `cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' })`.
- **Error Format**: Return `{ error: string, details?: unknown }` consistently.
- **Tests**: Test service & HTTP endpoints with Vitest + Supertest using an in-memory SQLite database.
