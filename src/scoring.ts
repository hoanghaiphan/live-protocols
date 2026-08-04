import type { Category, Frequency, Habit } from './types'
import { CATEGORIES } from './types'

/** Expected hits per week by frequency (for overview %). */
export const WEEKLY_TARGETS: Record<Frequency, number> = {
  daily: 7,
  several_per_week: 3,
  weekly: 1,
}

const FREQ_MULTIPLIER: Record<Frequency, number> = {
  daily: 1.0,
  several_per_week: 0.6,
  weekly: 0.35,
}

/**
 * Radar fills quickly with a small active set.
 * Lower max (5) = “smaller maximum value” on the chart.
 */
export const RADAR_REFERENCE = 4
export const RADAR_MAX = 5

export const TIME_WARN_MINUTES = 12 * 60

export function effectMean(habit: Habit): number {
  const { shortTerm, longTerm, identity } = habit.effect
  return (shortTerm + longTerm + identity) / 3
}

export function habitWeight(habit: Habit): number {
  return effectMean(habit) * FREQ_MULTIPLIER[habit.frequency]
}

export function weeklyTarget(habit: Habit): number {
  return WEEKLY_TARGETS[habit.frequency]
}

export function weeklyTimeEstimate(habits: Habit[]): number {
  return habits.reduce(
    (sum, h) => sum + h.timeEstimateMinutes * weeklyTarget(h),
    0,
  )
}

export type CategoryScores = Record<Category, number>

export function categoryWeights(habits: Habit[]): Record<Category, number> {
  const weights = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<
    Category,
    number
  >
  for (const h of habits) {
    weights[h.category] += habitWeight(h)
  }
  return weights
}

/** Scores in 0…RADAR_MAX for the hex chart. */
export function categoryScores(habits: Habit[]): CategoryScores {
  const weights = categoryWeights(habits)
  const scores = {} as CategoryScores
  for (const c of CATEGORIES) {
    scores[c] = Math.min(RADAR_MAX, weights[c] / RADAR_REFERENCE)
  }
  return scores
}

export function weakestCategory(scores: CategoryScores): Category | null {
  const entries = CATEGORIES.map((c) => [c, scores[c]] as const)
  if (entries.every(([, s]) => s === 0)) return null
  entries.sort((a, b) => a[1] - b[1])
  return entries[0][0]
}

/** Consistency from day-check map for one ISO week’s dates. */
export function weekConsistencyPercent(
  habits: Habit[],
  checksByDate: Record<string, Record<string, boolean>>,
  dateKeys: string[],
): number {
  if (habits.length === 0 || dateKeys.length === 0) return 0
  let done = 0
  let target = 0
  for (const h of habits) {
    const t = weeklyTarget(h)
    target += t
    let hits = 0
    for (const d of dateKeys) {
      if (checksByDate[d]?.[h.id]) hits++
    }
    done += Math.min(hits, t)
  }
  if (target === 0) return 0
  return Math.round((done / target) * 100)
}

export function stdDev(values: number[]): number {
  if (values.length === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}
