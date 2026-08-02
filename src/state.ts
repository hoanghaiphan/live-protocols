import type {
  ExportBlob,
  Habit,
  Pack,
  ProgressLog,
  WeeklyProtocol,
} from './types'
import { isoWeekKey } from './weeks'
import habitsJson from '../data/habits.json'
import packsJson from '../data/packs.json'

const KEY_ACTIVE = 'lp:activeWeek'
const KEY_PROTOCOL = (w: string) => `lp:protocol:${w}`
const KEY_PROGRESS = (w: string) => `lp:progress:${w}`
const KEY_CUSTOM_HABITS = 'lp:customHabits'
const KEY_HABIT_OVERRIDES = 'lp:habitOverrides'
const KEY_CUSTOM_PACKS = 'lp:customPacks'

const coreHabits: Habit[] = habitsJson as Habit[]
const builtInPacks: Pack[] = (packsJson as Pack[]).map((p) => ({
  ...p,
  custom: false,
}))

// ── Library merge ──────────────────────────────────────────────

function loadJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getCustomHabits(): Habit[] {
  return loadJson<Habit[]>(KEY_CUSTOM_HABITS, [])
}

export function getHabitOverrides(): Record<string, Habit> {
  return loadJson<Record<string, Habit>>(KEY_HABIT_OVERRIDES, {})
}

export function getCustomPacks(): Pack[] {
  return loadJson<Pack[]>(KEY_CUSTOM_PACKS, []).map((p) => ({
    ...p,
    custom: true,
  }))
}

function saveCustomHabits(list: Habit[]): void {
  localStorage.setItem(KEY_CUSTOM_HABITS, JSON.stringify(list))
}

function saveHabitOverrides(map: Record<string, Habit>): void {
  localStorage.setItem(KEY_HABIT_OVERRIDES, JSON.stringify(map))
}

function saveCustomPacks(list: Pack[]): void {
  localStorage.setItem(KEY_CUSTOM_PACKS, JSON.stringify(list))
}

/** Full merged library: core + overrides + custom habits. */
export function getHabits(): Habit[] {
  const overrides = getHabitOverrides()
  const custom = getCustomHabits()
  const coreMerged = coreHabits.map((h) => overrides[h.id] ?? h)
  // Custom habits may also be overridden if edited after creation
  const customMerged = custom.map((h) => overrides[h.id] ?? h)
  const coreIds = new Set(coreHabits.map((h) => h.id))
  // Avoid duplicating if a custom id collides (shouldn't)
  const extras = customMerged.filter((h) => !coreIds.has(h.id))
  return [...coreMerged, ...extras]
}

export function getPacks(): Pack[] {
  return [...builtInPacks, ...getCustomPacks()]
}

export function getHabit(id: string): Habit | undefined {
  return getHabits().find((h) => h.id === id)
}

export function getHabitsByIds(ids: string[]): Habit[] {
  const map = new Map(getHabits().map((h) => [h.id, h]))
  return ids.map((id) => map.get(id)).filter((h): h is Habit => !!h)
}

export function isCoreHabit(id: string): boolean {
  return coreHabits.some((h) => h.id === id)
}

export function isCustomHabit(id: string): boolean {
  return getCustomHabits().some((h) => h.id === id) && !isCoreHabit(id)
}

/** Upsert habit: new local habit or override existing. */
export function saveHabit(habit: Habit): void {
  if (isCoreHabit(habit.id)) {
    const overrides = getHabitOverrides()
    overrides[habit.id] = { ...habit, source: habit.source ?? 'core' }
    saveHabitOverrides(overrides)
    return
  }

  const custom = getCustomHabits()
  const idx = custom.findIndex((h) => h.id === habit.id)
  const next = { ...habit, source: 'local' as const }
  if (idx >= 0) {
    custom[idx] = next
  } else {
    custom.push(next)
  }
  // Clear any stale override for this custom id
  const overrides = getHabitOverrides()
  if (overrides[habit.id]) {
    delete overrides[habit.id]
    saveHabitOverrides(overrides)
  }
  saveCustomHabits(custom)
}

/** Delete a user-created habit (core habits cannot be deleted). */
export function deleteHabit(id: string): boolean {
  if (isCoreHabit(id)) return false
  const custom = getCustomHabits().filter((h) => h.id !== id)
  saveCustomHabits(custom)
  const overrides = getHabitOverrides()
  if (overrides[id]) {
    delete overrides[id]
    saveHabitOverrides(overrides)
  }
  // Strip from custom packs
  const packs = getCustomPacks().map((p) => ({
    ...p,
    habitIds: p.habitIds.filter((hid) => hid !== id),
  }))
  saveCustomPacks(packs)
  // Strip from all week protocols
  for (const k of collectKeys('lp:protocol:')) {
    const week = k.slice('lp:protocol:'.length)
    const protocol = loadProtocol(week)
    if (protocol.habitIds.includes(id)) {
      saveProtocol(week, {
        ...protocol,
        habitIds: protocol.habitIds.filter((hid) => hid !== id),
      })
    }
  }
  return true
}

export function savePack(pack: Pack): void {
  if (!pack.custom && builtInPacks.some((p) => p.id === pack.id)) {
    // Don't mutate built-ins; save as custom clone if user "edits"
    // Built-in packs are apply-only; custom packs only in KEY_CUSTOM_PACKS
    return
  }
  const list = getCustomPacks()
  const next: Pack = {
    ...pack,
    custom: true,
  }
  const idx = list.findIndex((p) => p.id === pack.id)
  if (idx >= 0) list[idx] = next
  else list.push(next)
  saveCustomPacks(list)
}

export function deletePack(id: string): boolean {
  const list = getCustomPacks()
  if (!list.some((p) => p.id === id)) return false
  saveCustomPacks(list.filter((p) => p.id !== id))
  return true
}

export function getPack(id: string): Pack | undefined {
  return getPacks().find((p) => p.id === id)
}

// ── Week / progress ────────────────────────────────────────────

export function getActiveWeek(): string {
  return localStorage.getItem(KEY_ACTIVE) ?? isoWeekKey()
}

export function setActiveWeek(weekKey: string): void {
  localStorage.setItem(KEY_ACTIVE, weekKey)
}

export function loadProtocol(weekKey: string): WeeklyProtocol {
  const raw = localStorage.getItem(KEY_PROTOCOL(weekKey))
  if (!raw) return { habitIds: [] }
  try {
    const parsed = JSON.parse(raw) as WeeklyProtocol
    return {
      habitIds: Array.isArray(parsed.habitIds) ? parsed.habitIds : [],
      notes: parsed.notes,
    }
  } catch {
    return { habitIds: [] }
  }
}

export function saveProtocol(weekKey: string, protocol: WeeklyProtocol): void {
  localStorage.setItem(KEY_PROTOCOL(weekKey), JSON.stringify(protocol))
}

export function loadProgress(weekKey: string): ProgressLog {
  const raw = localStorage.getItem(KEY_PROGRESS(weekKey))
  if (!raw) return { completions: {} }
  try {
    const parsed = JSON.parse(raw) as ProgressLog
    return { completions: parsed.completions ?? {} }
  } catch {
    return { completions: {} }
  }
}

export function saveProgress(weekKey: string, progress: ProgressLog): void {
  localStorage.setItem(KEY_PROGRESS(weekKey), JSON.stringify(progress))
}

function collectKeys(prefix: string): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(prefix)) keys.push(k)
  }
  return keys
}

// ── Export / import ────────────────────────────────────────────

export function exportAll(): ExportBlob {
  const protocols: Record<string, WeeklyProtocol> = {}
  const progress: Record<string, ProgressLog> = {}

  for (const k of collectKeys('lp:protocol:')) {
    const week = k.slice('lp:protocol:'.length)
    protocols[week] = loadProtocol(week)
  }
  for (const k of collectKeys('lp:progress:')) {
    const week = k.slice('lp:progress:'.length)
    progress[week] = loadProgress(week)
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activeWeek: getActiveWeek(),
    protocols,
    progress,
    customHabits: getCustomHabits(),
    habitOverrides: getHabitOverrides(),
    customPacks: getCustomPacks(),
  }
}

export function importAll(blob: ExportBlob): void {
  if (blob.version !== 1) throw new Error('Unsupported export version')
  if (blob.activeWeek) setActiveWeek(blob.activeWeek)
  for (const [week, protocol] of Object.entries(blob.protocols ?? {})) {
    saveProtocol(week, protocol)
  }
  for (const [week, prog] of Object.entries(blob.progress ?? {})) {
    saveProgress(week, prog)
  }
  if (blob.customHabits) saveCustomHabits(blob.customHabits)
  if (blob.habitOverrides) saveHabitOverrides(blob.habitOverrides)
  if (blob.customPacks) {
    saveCustomPacks(blob.customPacks.map((p) => ({ ...p, custom: true })))
  }
}

export function downloadExport(): void {
  const blob = exportAll()
  const text = JSON.stringify(blob, null, 2)
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `life-protocols-export-${blob.activeWeek}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// Back-compat aliases used by older imports (prefer getHabits/getPacks)
export const habits = {
  get length() {
    return getHabits().length
  },
}
