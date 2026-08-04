/**
 * Data integrity + scoring fixture checks (no browser).
 * Keep formula constants in sync with src/scoring.ts.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CATEGORIES = [
  'health',
  'intelligence',
  'social',
  'finance',
  'career',
  'creativity',
]
const FREQUENCIES = ['daily', 'several_per_week', 'weekly']
const WEEKLY_TARGETS = { daily: 5, several_per_week: 3, weekly: 1 }
const FREQ_MULTIPLIER = { daily: 1.0, several_per_week: 0.6, weekly: 0.35 }
const RADAR_REFERENCE = 6

let failed = 0

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`)
    failed++
  } else {
    console.log(`ok  — ${msg}`)
  }
}

function loadJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'))
}

function effectMean(h) {
  return (h.effect.shortTerm + h.effect.longTerm + h.effect.identity) / 3
}

function habitWeight(h) {
  return effectMean(h) * FREQ_MULTIPLIER[h.frequency]
}

function categoryScores(habits) {
  const weights = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const h of habits) weights[h.category] += habitWeight(h)
  const scores = {}
  for (const c of CATEGORIES) scores[c] = Math.min(10, weights[c] / RADAR_REFERENCE)
  return scores
}

function consistencyPercent(habits, completions) {
  if (habits.length === 0) return 0
  let done = 0
  let target = 0
  for (const h of habits) {
    const t = WEEKLY_TARGETS[h.frequency]
    target += t
    done += Math.min(completions[h.id] ?? 0, t)
  }
  if (target === 0) return 0
  return Math.round((done / target) * 100)
}

// ── Data ───────────────────────────────────────────────────────
const habits = loadJson('data/habits.json')
const packs = loadJson('data/packs.json')

assert(Array.isArray(habits) && habits.length >= 30, `at least 30 core habits (got ${habits.length})`)
assert(Array.isArray(packs) && packs.length >= 4, 'at least 4 packs')

const ids = new Set()
const catCount = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))

for (const h of habits) {
  assert(typeof h.id === 'string' && h.id.length > 0, `habit id present (${h.name})`)
  assert(!ids.has(h.id), `unique id ${h.id}`)
  ids.add(h.id)
  assert(CATEGORIES.includes(h.category), `${h.id} valid category`)
  assert(FREQUENCIES.includes(h.frequency), `${h.id} valid frequency`)
  assert(typeof h.name === 'string' && h.name.length > 0, `${h.id} has name`)
  assert(typeof h.description === 'string' && h.description.length > 0, `${h.id} has why/description`)
  assert(typeof h.how === 'string' && h.how.trim().length > 0, `${h.id} has how steps`)
  for (const k of ['time', 'willpower', 'energy']) {
    const v = h.difficulty?.[k]
    assert(v >= 1 && v <= 10, `${h.id} difficulty.${k} in 1–10`)
  }
  for (const k of ['shortTerm', 'longTerm', 'identity']) {
    const v = h.effect?.[k]
    assert(v >= 1 && v <= 10, `${h.id} effect.${k} in 1–10`)
  }
  catCount[h.category]++
}

for (const c of CATEGORIES) {
  assert(catCount[c] >= 5, `category ${c} has ≥5 habits (got ${catCount[c]})`)
}

for (const p of packs) {
  assert(p.id && p.name, `pack ${p.id || '?'} has id+name`)
  assert(Array.isArray(p.habitIds) && p.habitIds.length > 0, `pack ${p.id} has habits`)
  for (const hid of p.habitIds) {
    assert(ids.has(hid), `pack ${p.id} references existing habit ${hid}`)
  }
}

// ── Scoring fixtures (mirror src/scoring.ts) ───────────────────
const sample = {
  id: 't-daily',
  name: 'T',
  description: 'Why: d',
  how: '1) Do the thing.',
  category: 'health',
  secondaryTags: [],
  difficulty: { time: 1, willpower: 1, energy: 1 },
  effect: { shortTerm: 6, longTerm: 6, identity: 6 },
  med: '',
  highIntensity: '',
  frequency: 'daily',
  timeEstimateMinutes: 10,
  source: 'core',
}

assert(effectMean(sample) === 6, 'effectMean of 6/6/6 is 6')
assert(habitWeight(sample) === 6, 'daily weight = mean * 1.0')

const weekly = { ...sample, id: 't-weekly', frequency: 'weekly', category: 'finance' }
assert(Math.abs(habitWeight(weekly) - 6 * 0.35) < 1e-9, 'weekly weight uses 0.35 mult')

const scores = categoryScores([sample, weekly])
assert(scores.health === Math.min(10, 6 / 6), 'health axis from daily habit')
assert(scores.finance === Math.min(10, (6 * 0.35) / 6), 'finance axis from weekly habit')
assert(scores.intelligence === 0, 'empty axis is 0')

const pct = consistencyPercent(
  [sample, weekly],
  { 't-daily': 5, 't-weekly': 1 },
)
assert(pct === 100, 'full completion is 100%')

const partial = consistencyPercent([sample], { 't-daily': 2 })
assert(partial === 40, '2/5 daily hits is 40%')

const over = consistencyPercent([sample], { 't-daily': 99 })
assert(over === 100, 'over-completion caps at target for %')

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`)
  process.exit(1)
}
console.log('\nvalidate: all checks passed')
