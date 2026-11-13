---
name: ai-dispatch-agent
description: Guidelines for maintaining the AI Dispatch Agent system prompt, structured JSON output, and fallback logic.
---

# AI Dispatch Agent Conventions

- **Prompt Location**: `packages/backend/src/prompts/dispatchPrompt.ts`.
- **Output Contract**: Must strictly match `specs/ai-dispatch-agent.md` JSON schema.
- **Safety & Reliability**:
  - Never invent courier IDs — only select from the provided live available couriers list.
  - Always fall back to deterministic scoring if `OPENAI_API_KEY` is missing, rate-limited, or returns invalid JSON.
  - Keep reasoning concise (1–2 sentences) and grounded in weather, distance, package fragility, and CO₂ impact.
