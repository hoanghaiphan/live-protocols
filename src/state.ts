import type {
  ActiveHabitEntry,
  DayChecks,
  ExportBlob,
  Habit,
  HabitStage,
  Pack,
  ProgressLog,
  WeeklyProtocol,
} from './types'
import {
  WEEKLY_TARGET_MAX,
  WEEKLY_TARGET_MIN,
} from './types'
import { resolveWeeklyTarget, weeklyTarget as defaultWeeklyTarget } from './scoring'
import { isoWeekKey } from './weeks'
import habitsJson from '../data/habits.json'
import packsJson from '../data/packs.json'

const KEY_ACTIVE_HABITS = 'lp:activeHabits'
const KEY_DAY = (d: string) => `lp:day:${d}`
const KEY_OVERVIEW_WEEK = 'lp:overviewWeek'
const KEY_LEGACY_WEEK = 'lp:activeWeek'
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

function loadJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function collectKeys(prefix: string): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(prefix)) keys.push(k)
  }
  return keys
}

// ── Library ────────────────────────────────────────────────────

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

export function getHabits(): Habit[] {
  const overrides = getHabitOverrides()
  const custom = getCustomHabits()
  const coreMerged = coreHabits.map((h) => overrides[h.id] ?? h)
  const customMerged = custom.map((h) => overrides[h.id] ?? h)
  const coreIds = new Set(coreHabits.map((h) => h.id))
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
  if (idx >= 0) custom[idx] = next
  else custom.push(next)
  const overrides = getHabitOverrides()
  if (overrides[habit.id]) {
    delete overrides[habit.id]
    saveHabitOverrides(overrides)
  }
  saveCustomHabits(custom)
}

export function deleteHabit(id: string): boolean {
  if (isCoreHabit(id)) return false
  saveCustomHabits(getCustomHabits().filter((h) => h.id !== id))
  const overrides = getHabitOverrides()
  if (overrides[id]) {
    delete overrides[id]
    saveHabitOverrides(overrides)
  }
  saveCustomPacks(
    getCustomPacks().map((p) => ({
      ...p,
      habitIds: p.habitIds.filter((hid) => hid !== id),
    })),
  )
  removeActiveHabit(id)
  return true
}

export function savePack(pack: Pack): void {
  if (!pack.custom && builtInPacks.some((p) => p.id === pack.id)) return
  const list = getCustomPacks()
  const next: Pack = { ...pack, custom: true }
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

// ── Active habits (sticky) ─────────────────────────────────────

function migrateActiveFromLegacy(): ActiveHabitEntry[] | null {
  // Prefer newest non-empty protocol
  const keys = collectKeys('lp:protocol:')
  let best: string[] = []
  for (const k of keys) {
    try {
      const p = JSON.parse(localStorage.getItem(k) ?? '') as WeeklyProtocol
      if (Array.isArray(p.habitIds) && p.habitIds.length > best.length) {
        best = p.habitIds
      }
    } catch {
      /* skip */
    }
  }
  if (best.length === 0) return null
  return best.map((habitId) => ({ habitId, stage: 'forming' as const }))
}

function normalizeEntry(e: ActiveHabitEntry): ActiveHabitEntry | null {
  if (!e || typeof e.habitId !== 'string') return null
  if (e.stage !== 'forming' && e.stage !== 'formed') return null
  const out: ActiveHabitEntry = { habitId: e.habitId, stage: e.stage }
  if (typeof e.weeklyTarget === 'number' && Number.isFinite(e.weeklyTarget)) {
    out.weeklyTarget = Math.min(
      WEEKLY_TARGET_MAX,
      Math.max(WEEKLY_TARGET_MIN, Math.round(e.weeklyTarget)),
    )
  }
  return out
}

export function getActiveEntries(): ActiveHabitEntry[] {
  const raw = localStorage.getItem(KEY_ACTIVE_HABITS)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ActiveHabitEntry[]
      if (Array.isArray(parsed)) {
        return parsed
          .map(normalizeEntry)
          .filter((e): e is ActiveHabitEntry => !!e)
      }
    } catch {
      /* fall through */
    }
  }
  const migrated = migrateActiveFromLegacy()
  if (migrated) {
    saveActiveEntries(migrated)
    return migrated
  }
  return []
}

export function saveActiveEntries(entries: ActiveHabitEntry[]): void {
  localStorage.setItem(KEY_ACTIVE_HABITS, JSON.stringify(entries))
}

export function getActiveHabitIds(): string[] {
  return getActiveEntries().map((e) => e.habitId)
}

export function isActive(habitId: string): boolean {
  return getActiveEntries().some((e) => e.habitId === habitId)
}

export function addActiveHabit(
  habitId: string,
  stage: HabitStage = 'forming',
): void {
  const entries = getActiveEntries()
  if (entries.some((e) => e.habitId === habitId)) return
  const habit = getHabit(habitId)
  entries.push({
    habitId,
    stage,
    weeklyTarget: habit ? defaultWeeklyTarget(habit) : 3,
  })
  saveActiveEntries(entries)
}

export function removeActiveHabit(habitId: string): void {
  saveActiveEntries(getActiveEntries().filter((e) => e.habitId !== habitId))
}

export function setHabitStage(habitId: string, stage: HabitStage): void {
  const entries = getActiveEntries().map((e) =>
    e.habitId === habitId ? { ...e, stage } : e,
  )
  saveActiveEntries(entries)
}

export function getEntryWeeklyTarget(entry: ActiveHabitEntry): number {
  const habit = getHabit(entry.habitId)
  if (!habit) return entry.weeklyTarget ?? 3
  return resolveWeeklyTarget(habit, entry.weeklyTarget)
}

export function setActiveWeeklyTarget(habitId: string, target: number): void {
  const n = Math.min(
    WEEKLY_TARGET_MAX,
    Math.max(WEEKLY_TARGET_MIN, Math.round(target)),
  )
  const entries = getActiveEntries().map((e) =>
    e.habitId === habitId ? { ...e, weeklyTarget: n } : e,
  )
  saveActiveEntries(entries)
}

export function bumpActiveWeeklyTarget(habitId: string, delta: number): void {
  const entry = getActiveEntries().find((e) => e.habitId === habitId)
  if (!entry) return
  const cur = getEntryWeeklyTarget(entry)
  setActiveWeeklyTarget(habitId, cur + delta)
}

/**
 * Log +1 hit for the week: mark today done if not already.
 * Returns whether state changed.
 */
export function logHitToday(habitId: string, todayKey: string): boolean {
  if (isDayDone(todayKey, habitId)) return false
  setDayDone(todayKey, habitId, true)
  return true
}

/**
 * Undo a hit: clear today if set; else clear the latest done day in dateKeys.
 */
export function undoHitInWeek(
  habitId: string,
  todayKey: string,
  dateKeys: string[],
): boolean {
  if (isDayDone(todayKey, habitId)) {
    setDayDone(todayKey, habitId, false)
    return true
  }
  for (let i = dateKeys.length - 1; i >= 0; i--) {
    const d = dateKeys[i]
    if (isDayDone(d, habitId)) {
      setDayDone(d, habitId, false)
      return true
    }
  }
  return false
}

/** Merge pack habit ids into active as forming (skip already active). */
export function applyPackToActive(packId: string): number {
  const pack = getPack(packId)
  if (!pack) return 0
  const entries = getActiveEntries()
  const have = new Set(entries.map((e) => e.habitId))
  let added = 0
  for (const id of pack.habitIds) {
    if (have.has(id)) continue
    if (!getHabit(id)) continue
    const habit = getHabit(id)!
    entries.push({
      habitId: id,
      stage: 'forming',
      weeklyTarget: defaultWeeklyTarget(habit),
    })
    have.add(id)
    added++
  }
  saveActiveEntries(entries)
  return added
}

// ── Day checks ─────────────────────────────────────────────────

export function loadDayChecks(dateKey: string): DayChecks {
  return loadJson<DayChecks>(KEY_DAY(dateKey), { done: {} })
}

export function saveDayChecks(dateKey: string, checks: DayChecks): void {
  localStorage.setItem(KEY_DAY(dateKey), JSON.stringify(checks))
}

export function setDayDone(
  dateKey: string,
  habitId: string,
  done: boolean,
): void {
  const checks = loadDayChecks(dateKey)
  if (done) checks.done[habitId] = true
  else delete checks.done[habitId]
  saveDayChecks(dateKey, checks)
}

export function isDayDone(dateKey: string, habitId: string): boolean {
  return !!loadDayChecks(dateKey).done[habitId]
}

export function loadChecksForDates(
  dateKeys: string[],
): Record<string, Record<string, boolean>> {
  const out: Record<string, Record<string, boolean>> = {}
  for (const d of dateKeys) {
    out[d] = loadDayChecks(d).done
  }
  return out
}

// ── Overview week ──────────────────────────────────────────────

export function getOverviewWeek(): string {
  return (
    localStorage.getItem(KEY_OVERVIEW_WEEK) ??
    localStorage.getItem(KEY_LEGACY_WEEK) ??
    isoWeekKey()
  )
}

export function setOverviewWeek(weekKey: string): void {
  localStorage.setItem(KEY_OVERVIEW_WEEK, weekKey)
}

// ── Export / import ────────────────────────────────────────────

export function exportAll(): ExportBlob {
  const dayChecks: Record<string, DayChecks> = {}
  for (const k of collectKeys('lp:day:')) {
    const date = k.slice('lp:day:'.length)
    dayChecks[date] = loadDayChecks(date)
  }

  // Legacy fields for older backups
  const protocols: Record<string, WeeklyProtocol> = {}
  const progress: Record<string, ProgressLog> = {}
  for (const k of collectKeys('lp:protocol:')) {
    const week = k.slice('lp:protocol:'.length)
    try {
      protocols[week] = JSON.parse(localStorage.getItem(k) ?? '{}') as WeeklyProtocol
    } catch {
      /* skip */
    }
  }
  for (const k of collectKeys('lp:progress:')) {
    const week = k.slice('lp:progress:'.length)
    try {
      progress[week] = JSON.parse(localStorage.getItem(k) ?? '{}') as ProgressLog
    } catch {
      /* skip */
    }
  }

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    activeWeek: getOverviewWeek(),
    overviewWeek: getOverviewWeek(),
    protocols,
    progress,
    customHabits: getCustomHabits(),
    habitOverrides: getHabitOverrides(),
    customPacks: getCustomPacks(),
    activeHabits: getActiveEntries(),
    dayChecks,
  }
}

export function importAll(blob: ExportBlob): void {
  if (blob.version !== 1) throw new Error('Unsupported export version')

  if (blob.customHabits) saveCustomHabits(blob.customHabits)
  if (blob.habitOverrides) saveHabitOverrides(blob.habitOverrides)
  if (blob.customPacks) {
    saveCustomPacks(blob.customPacks.map((p) => ({ ...p, custom: true })))
  }

  if (blob.activeHabits && Array.isArray(blob.activeHabits)) {
    saveActiveEntries(blob.activeHabits)
  } else if (blob.protocols) {
    // Migrate from weekly protocol export
    let best: string[] = []
    for (const p of Object.values(blob.protocols)) {
      if (p.habitIds?.length > best.length) best = p.habitIds
    }
    if (best.length) {
      saveActiveEntries(best.map((habitId) => ({ habitId, stage: 'forming' })))
    }
  }

  if (blob.dayChecks) {
    for (const [date, checks] of Object.entries(blob.dayChecks)) {
      saveDayChecks(date, checks)
    }
  }

  // Legacy week progress → approximate day checks not available; keep protocols for history
  if (blob.protocols) {
    for (const [week, protocol] of Object.entries(blob.protocols)) {
      localStorage.setItem(KEY_PROTOCOL(week), JSON.stringify(protocol))
    }
  }
  if (blob.progress) {
    for (const [week, prog] of Object.entries(blob.progress)) {
      localStorage.setItem(KEY_PROGRESS(week), JSON.stringify(prog))
    }
  }

  const week = blob.overviewWeek ?? blob.activeWeek
  if (week) setOverviewWeek(week)
}

export function downloadExport(): void {
  const blob = exportAll()
  const text = JSON.stringify(blob, null, 2)
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `life-protocols-export-${blob.overviewWeek ?? 'data'}.json`
  a.click()
  URL.revokeObjectURL(url)
}
