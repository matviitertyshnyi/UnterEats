# DESIGN.md — UnterEats Visual & Interaction System

## Mode & Use Scene
- **Mode**: `Operate` — local-business delivery dispatch workbench used in daytime shop counters and bright offices.
- **Visual Direction**: *Neighborhood Market Ledger* — warm alabaster surfaces, crisp hairline borders, tabular numerals for logistics metrics, and terracotta/sage accents.

## Color Palette
- **Canvas (`--bg-canvas`)**: `#FAF8F4` (warm alabaster)
- **Surface (`--bg-surface`)**: `#FFFFFF`
- **Subtle Surface (`--bg-subtle`)**: `#F3EFE8`
- **Primary Ink (`--ink-primary`)**: `#1C1917`
- **Secondary Ink (`--ink-secondary`)**: `#57534E`
- **Hairline Border (`--border-subtle`)**: `#E7E2DA`
- **Primary Action (`--accent-primary`)**: `#C2410C` (Terracotta) / hover `#9A3412`
- **Eco / CO₂ Accent (`--accent-eco`)**: `#15803D` (Forest Sage)
- **Express / Caution (`--accent-amber`)**: `#B45309`

## Typography
- **UI & Headings**: `Plus Jakarta Sans`, sans-serif
- **Logistics Data / Numerals**: `JetBrains Mono` / `tabular-nums` for order IDs, distances (`km`), ETAs (`min`), and CO₂ saved (`g`).

## Layout & Hierarchy
- **Top Bar**: Brand identity + live inline dispatch summary (active orders, online couriers, CO₂ saved).
- **Main Workspace (12-col grid)**:
  - **Dispatch Queue (8 cols)**: Status filter tabs + clean scannable order rows with inline courier assignment, status progression, and delete action.
  - **Dispatch Rail (4 cols)**:
    1. **AI Dispatch Agent**: Natural-language prompt, quick scenario presets, structured recommendation card, and one-click "Use in Order Form".
    2. **Create Delivery / Fleet & Shops**: Tabbed panel to dispatch a new order (pre-fillable by AI) or manage local businesses and courier availability.

## Browser & Craft Rules
- `lucide-react` icons only (no emoji UI icons).
- Custom `::selection`, `caret-color`, `focus-visible` outlines, and subtle scrollbars tuned to `#C2410C` and `#E7E2DA`.
- All async views handle loading, empty, and error states with clear recovery actions.
