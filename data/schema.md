# Life Protocols — data schema

## Habit

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable slug, e.g. `intel-deep-work` |
| `name` | string | Display name |
| `description` | string | **Why** — purpose / rationale (may start with `Why:`) |
| `how` | string | **How** — concrete steps (newlines OK) |
| `category` | enum | `health` \| `intelligence` \| `social` \| `finance` \| `career` \| `creativity` |
| `secondaryTags` | string[] | Optional; **not** used for radar axes in v0.1 |
| `difficulty.time` | 1–10 | Time cost |
| `difficulty.willpower` | 1–10 | Willpower cost |
| `difficulty.energy` | 1–10 | Physical/mental energy cost |
| `effect.shortTerm` | 1–10 | Near-term effect vs current baseline |
| `effect.longTerm` | 1–10 | Compounding |
| `effect.identity` | 1–10 | Skill / identity shift |
| `med` | string | Minimum effective dose version |
| `highIntensity` | string | High-intensity version |
| `frequency` | enum | `daily` \| `several_per_week` \| `weekly` |
| `timeEstimateMinutes` | number | Typical session minutes (0 = rule/constraint) |
| `source` | enum | `core` \| `pack` \| `local` \| `community` |

## Pack

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Stable slug |
| `name` | string | Display name |
| `description` | string | Intent of the pack |
| `habitIds` | string[] | References habit `id`s |

## User state (browser `localStorage`)

| Key | Value |
|-----|--------|
| `lp:activeHabits` | `{ habitId, stage: "forming"\|"formed" }[]` sticky set |
| `lp:day:YYYY-MM-DD` | `{ done: { [habitId]: true } }` day checkboxes |
| `lp:overviewWeek` | ISO week for table / overview navigation |
| `lp:customHabits` | `Habit[]` user-created (`source: local`) |
| `lp:habitOverrides` | `{ [id]: Habit }` edits to core habits |
| `lp:customPacks` | `Pack[]` with `custom: true` |

Legacy `lp:protocol:*` / `lp:progress:*` may still exist and are migrated into active habits on first load.

Export/import includes active habits, day checks, customs, overrides, packs.

## Scoring

- Habit weight = mean(effects) × frequency multiplier (`daily` 1.0, `several_per_week` 0.6, `weekly` 0.35)
- Radar score = min(**5**, sumWeights / **4**) — smaller max so a small active set still fills the hex
- Week targets for overview: daily→7, several→3, weekly→1
- Consistency = check-ins that week vs targets for active habits

## Community later

Add habits with `source: "community"` (or merge remote JSON by `id`). UI always reads the library array; no hardcoded names.
