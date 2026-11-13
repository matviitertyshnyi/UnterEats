---
name: frontend-ui
description: React + TypeScript + Tailwind conventions for UnterEats frontend. Defers to DESIGN.md for visual tokens.
---

# Frontend UI Conventions

- **Design Authority**: Always follow `DESIGN.md` for color tokens, typography, spacing, and visual hierarchy.
- **API Client**: Centralize all `fetch` calls in `src/api/client.ts` with strict TypeScript types matching `specs/mvp-spec.md`.
- **Data Fetching**: Fetch independent initial resources in parallel (`Promise.all`) — no sequential waterfalls.
- **UI States**: Every async view must handle loading, empty, and error states clearly.
- **Components**: Keep components small, single-purpose, and accessible (semantic HTML, keyboard focusable controls, clear labels).
