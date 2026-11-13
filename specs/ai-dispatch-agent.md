# AI Dispatch Agent Specification

## Purpose
Act as an intelligent last-mile local delivery dispatcher for neighborhood shops (pizzerias, flower shops, bakeries, pharmacies).

## Inputs
- `prompt`: Natural language request (e.g., *"Deliver 2 fragile flower bouquets 3.2 km in heavy rain within 25 minutes"*).
- `context` (optional): Available couriers from SQLite + registered local businesses.

## Structured Output Contract (JSON)
```json
{
  "recommendedVehicle": "cargo_bike",
  "matchedCourierId": 2,
  "matchedCourierName": "Marek K.",
  "etaMinutes": 18,
  "co2SavedGrams": 512,
  "reasoning": "Covered e-cargo bike protects fragile flowers from rain while beating car traffic over 3.2 km.",
  "suggestedOrder": {
    "packageType": "fragile_flowers",
    "urgency": "express",
    "weather": "rain",
    "distanceKm": 3.2,
    "notes": "Keep upright, protect from rain"
  },
  "mode": "llm | fallback"
}
```

## Execution Modes
1. **LLM Mode**: When `OPENAI_API_KEY` is configured, calls OpenAI Chat Completions with `response_format: { type: "json_object" }` and the system prompt in `packages/backend/src/prompts/dispatchPrompt.ts`.
2. **Deterministic Fallback Mode**: When `OPENAI_API_KEY` is absent or the API call fails, parses distance, weather, package fragility, and urgency from the prompt using deterministic scoring over live available couriers so the feature always works offline/out-of-the-box.
