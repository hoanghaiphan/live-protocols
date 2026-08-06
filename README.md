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
npm run build      # production build → dist/
npm run preview    # serve dist/
npm run validate   # typecheck + build + data/scoring checks
```

Agent/project rules: see `AGENTS.md` (and parent `Projects/AGENTS.md`).

## Host on Netlify

The repo includes `netlify.toml` (`npm run build` → publish `dist/`).

1. Push to GitHub (already done if remote is up to date, including `netlify.toml`).
2. Open [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
3. Connect GitHub and choose `hoanghaiphan/live-protocols` (or your fork).
4. Confirm build settings (should auto-fill from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy site**. You’ll get a URL like `https://random-name.netlify.app`.
6. Optional: **Domain settings** → custom domain or rename the site.

Every push to the production branch (usually `main`) triggers a new deploy.  
User data stays in each visitor’s browser `localStorage` (no Netlify backend required).

## Daily loop

1. **Packs** (6 habits each): **Add to active** merges into your set — remove what you do not want.
2. **Active plan** is a ~4-column grid: cell **fill** = hits / weekly target; **~time** = session effort.
3. **+ / −** log hits; **tgt±** adjusts weekly target (1–7) per habit.
4. Click a habit **name** for **Why / How** (full protocol). **✓** promotes forming → formed.
5. Week ‹ › only for overview history. **Export** backups to protect against browser wipe.

Includes **Huberman-aligned** protocols (educational synthesis of common Huberman Lab themes—not medical advice / not official).

**Huberman packs (6 habits each):** Foundations, Sleep (+ Advanced), Focus, Fitness (+ Advanced), Stress, Social, Learning Basic / Advanced, Creativity, Breath Basic / Advanced, Dopamine & Drive, Vision, Metabolism & Meals, Mind & Meditation, Light & Circadian.

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
