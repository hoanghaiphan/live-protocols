import type { Category, Frequency, Habit } from './types'
import { CATEGORIES } from './types'

/** Weekday-centric professional default (not 7). */
export const WEEKLY_TARGETS: Record<Frequency, number> = {
  daily: 5,
  several_per_week: 3,
  weekly: 1,
}

const FREQ_MULTIPLIER: Record<Frequency, number> = {
  daily: 1.0,
  several_per_week: 0.6,
  weekly: 0.35,
}

/** ~two solid daily-ish habits max out an axis. */
export const RADAR_REFERENCE = 6

/** Soft warning when estimated weekly minutes exceed this. */
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

/** Estimated minutes for a full week of targets. */
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

/** Normalize raw weights to 0–10 for the radar. */
export function categoryScores(habits: Habit[]): CategoryScores {
  const weights = categoryWeights(habits)
  const scores = {} as CategoryScores
  for (const c of CATEGORIES) {
    scores[c] = Math.min(10, weights[c] / RADAR_REFERENCE)
  }
  return scores
}

export function weakestCategory(scores: CategoryScores): Category | null {
  const entries = CATEGORIES.map((c) => [c, scores[c]] as const)
  if (entries.every(([, s]) => s === 0)) return null
  entries.sort((a, b) => a[1] - b[1])
  return entries[0][0]
}

export function consistencyPercent(
  habits: Habit[],
  completions: Record<string, number>,
): number {
  if (habits.length === 0) return 0
  let done = 0
  let target = 0
  for (const h of habits) {
    const t = weeklyTarget(h)
    target += t
    done += Math.min(completions[h.id] ?? 0, t)
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
