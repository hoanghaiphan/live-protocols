# Life Protocols

Local-first weekly habit protocol builder with a hexagonal balance radar across six life categories.

**Categories:** Health · Intelligence · Social / Network · Finance · Career · Creativity / Fun

## Quick start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production build → dist/
npm run preview  # serve dist/
```

## Sunday-night loop (~2 minutes)

1. Confirm the ISO week in the header (or jump with ‹ › / Today).
2. Apply a **starter pack** or add/remove habits from the **master library**.
3. Glance at the **hex radar** — fix a weak axis if the week looks lopsided.
4. During the week, use **+/−** on each protocol habit to log hits.
5. Optionally **Export** JSON monthly so a browser wipe doesn’t erase history.

## Data you can edit

| Path | Purpose |
|------|---------|
| `data/habits.json` | Master library (30 core habits) |
| `data/packs.json` | Starter packs |
| `data/schema.md` | Field contract + scoring notes |

### In the app

- **+ Habit** — create a custom habit (stored in `localStorage`)
- **Edit** on any habit — core habits save as local overrides; custom habits update in place
- **Delete** — custom habits only
- **+ Pack** — create a custom pack (defaults to this week’s selection); edit/delete custom packs only

After editing JSON files, Vite HMR reloads the core library. Selections, progress, custom habits, overrides, and custom packs live in **browser `localStorage`**.

### Category colors

| Category | Color |
|----------|-------|
| Health | Teal |
| Intelligence | Blue |
| Social | Coral |
| Finance | Gold |
| Career | Purple |
| Creativity | Pink |

Used on badges, chips, protocol borders, and radar axes.

### Scoring (v0.1)

- Radar weight = mean(short/long/identity effect) × frequency multiplier  
  (`daily` 1.0 · `several_per_week` 0.6 · `weekly` 0.35)
- Axis score = min(10, sumWeights / 6); primary category only
- Weekly targets for consistency: daily→5, several→3, weekly→1

## Export / import

Use **Export** / **Import** in the header. The blob includes protocols and progress per week (version 1). Safe to store in cloud drive.

## Design for later

- Habits have `source`: `core` | `pack` | `local` | `community`
- Stable string ids support a future shared library merge without rewriting the UI
- No accounts, auth, or backend in v0.1

## Stack

Vite + TypeScript + vanilla DOM. Custom SVG hex radar (no chart library).
