/** ISO week helpers (UTC-based calendar date). */

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Thursday-based ISO week number for a local Date. */
export function isoWeekKey(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1..Sun=7)
  const day = d.getDay() || 7
  d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${pad(weekNo)}`
}

/** Parse `YYYY-Www` to a Date on that week's Monday (local). */
export function weekKeyToMonday(weekKey: string): Date {
  const m = /^(\d{4})-W(\d{2})$/.exec(weekKey)
  if (!m) throw new Error(`Invalid week key: ${weekKey}`)
  const year = Number(m[1])
  const week = Number(m[2])
  // ISO: week 1 is the week with Jan 4
  const jan4 = new Date(year, 0, 4)
  const day = jan4.getDay() || 7
  const mondayWeek1 = new Date(jan4)
  mondayWeek1.setDate(jan4.getDate() - day + 1)
  const monday = new Date(mondayWeek1)
  monday.setDate(mondayWeek1.getDate() + (week - 1) * 7)
  return monday
}

export function shiftWeek(weekKey: string, delta: number): string {
  const monday = weekKeyToMonday(weekKey)
  monday.setDate(monday.getDate() + delta * 7)
  return isoWeekKey(monday)
}

export function formatWeekLabel(weekKey: string): string {
  const monday = weekKeyToMonday(weekKey)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${weekKey} · ${fmt(monday)} – ${fmt(sunday)}`
}

/** Last N week keys ending at `endKey` (inclusive), oldest first. */
export function recentWeekKeys(endKey: string, n: number): string[] {
  const keys: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    keys.push(shiftWeek(endKey, -i))
  }
  return keys
}
