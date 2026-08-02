export type Category =
  | 'health'
  | 'intelligence'
  | 'social'
  | 'finance'
  | 'career'
  | 'creativity'

export type Frequency = 'daily' | 'several_per_week' | 'weekly'

export type HabitSource = 'core' | 'pack' | 'local' | 'community'

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
  description: string
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
  /** Built-in packs omit this or use false; user-created packs are true. */
  custom?: boolean
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
  activeWeek: string
  protocols: Record<string, WeeklyProtocol>
  progress: Record<string, ProgressLog>
  /** User-created habits (source: local). */
  customHabits?: Habit[]
  /** Full habit overrides for core (or any) ids the user edited. */
  habitOverrides?: Record<string, Habit>
  /** User-created packs. */
  customPacks?: Pack[]
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

/** Distinct accent per category (dark-theme friendly). */
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

/** Clamp 1–10 for form fields. */
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
