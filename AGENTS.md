# AGENTS.md — Life Protocols (`habit/`)

Project rules for agents. Parent `Projects/AGENTS.md` still applies; this file wins on conflict.

## Product outcome

Local-first **weekly life-protocol builder**: pick habits from a master library (plus custom), apply packs, see a **hex radar** across six categories, log weekly hits, export/import state. Target loop: assemble a week in under ~2 minutes.

## Non-goals (unless asked)

- Accounts, auth, cloud sync, social/community UI
- React/Next or other framework rewrites
- Mobile apps, push notifications, calendar integrations
- AI coach / recommendation engine
- Perfect analytics dashboards

## Stack constraints

- Vite + TypeScript + vanilla DOM (no UI framework)
- Core library in `data/habits.json` + `data/packs.json` (diffable, editable without code)
- User state in **browser `localStorage`** only (`lp:*` keys)
- Custom SVG radar — no chart library
- Netlify static deploy: `npm run build` → `dist/` (`netlify.toml`)
- Prefer small diffs; do not bulk-regenerate the 30 core habits without a dedicated task

## Module map

| Path | Responsibility |
|------|----------------|
| `data/*.json` | Core habits + packs |
| `src/types.ts` | Domain types, category colors/labels |
| `src/state.ts` | Library merge, localStorage, export/import |
| `src/scoring.ts` | Radar weights, consistency, time estimate |
| `src/radar.ts` | SVG hexagon |
| `src/weeks.ts` | ISO week keys |
| `src/toast.ts` | Soft feedback (prefer over `alert`) |
| `src/ui.ts` | DOM render + events |
| `src/main.ts` | Boot |
| `scripts/validate.mjs` | Data integrity + scoring fixtures |

## Quality bar

1. **Boot**: `npm run dev` shows library + empty/current protocol; never blank white screen.
2. **Sunday loop**: apply pack or add habits → radar moves → +/− completions → consistency updates.
3. **Custom data**: add/edit habit, add/edit pack; custom only can delete; export includes customs/overrides.
4. **Category colors** stay consistent (badges, chips, protocol border, radar labels).
5. **A11y**: modals have `aria-modal`; Escape closes; first field focuses; visible focus rings.
6. Prefer **toasts** (`showToast`) for soft success/errors; keep `confirm()` only for destructive / replace actions.
7. After scoring or data-shape changes, `npm run validate` must pass.

## Validate before “done”

```powershell
cd habit
npm run validate
npm run dev
# Browser: URL Vite prints
```

Manual smoke:

1. Apply **Balance Reset** → radar non-zero on multiple axes  
2. +/− a habit completion → consistency % changes  
3. **+ Habit** → save → appears in library with category color  
4. **+ Pack** from current week → apply after clearing  
5. Export → Import → state restored; toast feedback  
6. Escape closes open modal  

## Lessons encoded

- Full `innerHTML` re-render is intentional for v0.1 simplicity; do not half-migrate to incremental DOM without a plan — event bindings must re-run after every render.
- Core habit “edits” are **overrides** in `lp:habitOverrides`, not mutations of `data/habits.json`.
- Built-in packs are apply-only; only `custom: true` packs live in `lp:customPacks`.
- Daily consistency target is **5** (weekday-centric), not 7 — do not “fix” to calendar days without product intent.
- Radar axes use **primary category only**; secondary tags are metadata, not split weights.
- Keep toast host on `document.body` so it survives `#app` re-renders.
- `scripts/validate.mjs` mirrors scoring formulas for node-side checks; if you change `scoring.ts`, update the script fixtures in the same change.
- Every habit needs **Why** (`description`) and **How** (`how` steps). MED / high-intensity are dose variants, not a substitute for How.
- Library size is not frozen at 30; validate checks ≥30 and ≥5 per category.
