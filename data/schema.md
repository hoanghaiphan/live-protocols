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
| `lp:activeWeek` | ISO week key `YYYY-Www` |
| `lp:protocol:<weekKey>` | `{ habitIds: string[], notes?: string }` |
| `lp:progress:<weekKey>` | `{ completions: { [habitId]: number } }` |
| `lp:customHabits` | `Habit[]` user-created (`source: local`) |
| `lp:habitOverrides` | `{ [id]: Habit }` edits to core (or any) habits |
| `lp:customPacks` | `Pack[]` with `custom: true` |

Export/import includes custom habits, overrides, and custom packs.

## Scoring (v0.1)

- Habit weight = mean(effects) × frequency multiplier (`daily` 1.0, `several_per_week` 0.6, `weekly` 0.35)
- Category radar score = min(10, sumWeights / 6)
- Weekly targets: daily→5, several→3, weekly→1
- Consistency = sum(min(done, target)) / sum(targets)

## Community later

Add habits with `source: "community"` (or merge remote JSON by `id`). UI always reads the library array; no hardcoded names.
