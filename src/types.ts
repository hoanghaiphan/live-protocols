export type Category =
  | 'health'
  | 'intelligence'
  | 'social'
  | 'finance'
  | 'career'
  | 'creativity'

export type Frequency = 'daily' | 'several_per_week' | 'weekly'

export type HabitSource = 'core' | 'pack' | 'local' | 'community'

/** Forming = still building; formed = stable habit. */
export type HabitStage = 'forming' | 'formed'

export interface Difficulty {
  time: number
  willpower: number
  energy: number
}

export interface Effect {
  shortTerm: number
  longTerm: number
  identity: number
}

export interface Habit {
  id: string
  name: string
  /** Why this habit matters. */
  description: string
  /** How to do it — concrete steps. */
  how: string
  category: Category
  secondaryTags: string[]
  difficulty: Difficulty
  effect: Effect
  med: string
  highIntensity: string
  frequency: Frequency
  timeEstimateMinutes: number
  source: HabitSource
}

export interface Pack {
  id: string
  name: string
  description: string
  habitIds: string[]
  custom?: boolean
}

/** Sticky active set (not rebuilt every week). */
export interface ActiveHabitEntry {
  habitId: string
  stage: HabitStage
}

/** Day log: which habits were done on YYYY-MM-DD. */
export interface DayChecks {
  done: Record<string, boolean>
}

export interface WeeklyProtocol {
  habitIds: string[]
  notes?: string
}

export interface ProgressLog {
  completions: Record<string, number>
}

export interface ExportBlob {
  version: 1
  exportedAt: string
  /** @deprecated week protocol model — kept for import migration */
  activeWeek?: string
  protocols?: Record<string, WeeklyProtocol>
  progress?: Record<string, ProgressLog>
  customHabits?: Habit[]
  habitOverrides?: Record<string, Habit>
  customPacks?: Pack[]
  /** Sticky active habits */
  activeHabits?: ActiveHabitEntry[]
  /** dateKey YYYY-MM-DD → day checks */
  dayChecks?: Record<string, DayChecks>
  /** ISO week used for overview navigation */
  overviewWeek?: string
}

export const CATEGORIES: Category[] = [
  'health',
  'intelligence',
  'social',
  'finance',
  'career',
  'creativity',
]

export const CATEGORY_LABELS: Record<Category, string> = {
  health: 'Health',
  intelligence: 'Intelligence',
  social: 'Social / Network',
  finance: 'Finance',
  career: 'Career',
  creativity: 'Creativity / Fun',
}

export const CATEGORY_COLORS: Record<Category, string> = {
  health: '#3dbaa0',
  intelligence: '#6b8cff',
  social: '#e07a5f',
  finance: '#e0a458',
  career: '#9b7bff',
  creativity: '#e86baa',
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: 'Daily',
  several_per_week: 'Several / week',
  weekly: 'Weekly',
}

export const FREQUENCIES: Frequency[] = [
  'daily',
  'several_per_week',
  'weekly',
]

/** Suggested max habits still in “forming”. */
export const FORMING_SOFT_MAX = 6

export function clampScore(n: number, fallback = 5): number {
  if (!Number.isFinite(n)) return fallback
  return Math.min(10, Math.max(1, Math.round(n)))
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'habit'
}
