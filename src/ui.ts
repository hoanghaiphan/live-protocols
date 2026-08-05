import {
  addActiveHabit,
  applyPackToActive,
  bumpActiveWeeklyTarget,
  deleteHabit,
  deletePack,
  downloadExport,
  getActiveEntries,
  getEntryWeeklyTarget,
  getHabit,
  getHabits,
  getHabitsByIds,
  getOverviewWeek,
  getPack,
  getPacks,
  importAll,
  isActive,
  isCoreHabit,
  isCustomHabit,
  loadChecksForDates,
  logHitToday,
  removeActiveHabit,
  saveHabit,
  savePack,
  setHabitStage,
  setOverviewWeek,
  undoHitInWeek,
} from './state'
import type {
  ActiveHabitEntry,
  Category,
  ExportBlob,
  Frequency,
  Habit,
  Pack,
} from './types'
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  FORMING_SOFT_MAX,
  FREQUENCIES,
  FREQUENCY_LABELS,
  clampScore,
  slugify,
} from './types'
import {
  categoryScores,
  countHitsInWeek,
  RADAR_MAX,
  weakestCategory,
  weekConsistencyPercent,
} from './scoring'
import { renderRadarSvg } from './radar'
import {
  formatWeekLabel,
  isoWeekKey,
  recentWeekKeys,
  shiftWeek,
  weekDateKeys,
} from './weeks'
import { showToast } from './toast'

let filterCategory: Category | 'all' = 'all'

type ModalState =
  | null
  | { kind: 'habit-view'; habitId: string }
  | { kind: 'habit-edit'; habitId: string | null }
  | { kind: 'pack'; packId: string | null }

let modal: ModalState = null
let escapeHandler: ((e: KeyboardEvent) => void) | null = null

function esc(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatMinutes(min: number): string {
  if (min <= 0) return 'rule'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function formatHowHtml(how: string): string {
  return esc(how).replaceAll('\n', '<br />')
}

function whyText(h: Habit): string {
  return h.description.replace(/^Why:\s*/i, '')
}

function catStyle(category: Category): string {
  const c = CATEGORY_COLORS[category]
  return `color:${c};background:${c}22;border-color:${c}55`
}

function catBorder(category: Category): string {
  return `border-left: 3px solid ${CATEGORY_COLORS[category]}`
}

function cadenceTag(freq: Frequency): string {
  if (freq === 'daily') return 'D'
  if (freq === 'several_per_week') return '3×'
  return 'W'
}

function uniqueHabitId(name: string): string {
  const base = `local-${slugify(name)}`
  const existing = new Set(getHabits().map((h) => h.id))
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

function uniquePackId(name: string): string {
  const base = `pack-${slugify(name)}`
  const existing = new Set(getPacks().map((p) => p.id))
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base}-${i}`)) i++
  return `${base}-${i}`
}

function emptyHabitDraft(): Habit {
  return {
    id: '',
    name: '',
    description: '',
    how: '',
    category: 'health',
    secondaryTags: [],
    difficulty: { time: 3, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 6, identity: 5 },
    med: '',
    highIntensity: '',
    frequency: 'weekly',
    timeEstimateMinutes: 30,
    source: 'local',
  }
}

function dateKeyLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayKey(): string {
  return dateKeyLocal(new Date())
}

function orderedActiveEntries(): ActiveHabitEntry[] {
  const entries = getActiveEntries()
  const forming = entries.filter((e) => e.stage === 'forming')
  const formed = entries.filter((e) => e.stage === 'formed')
  return [...forming, ...formed]
}

function targetMap(entries: ActiveHabitEntry[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const e of entries) map[e.habitId] = getEntryWeeklyTarget(e)
  return map
}

// ── Header / packs / radar ─────────────────────────────────────

function renderHeader(): string {
  return `
    <header class="header">
      <div class="brand">
        <h1>Life Protocols</h1>
        <p>Active plan · daily hits · balance</p>
      </div>
      <div class="header-actions">
        <button type="button" data-action="export">Export</button>
        <button type="button" data-action="import">Import</button>
        <input type="file" accept="application/json,.json" class="hidden-input" id="import-file" />
      </div>
    </header>
  `
}

function renderPacksBar(): string {
  const packs = getPacks()
  const options = packs
    .map(
      (p) =>
        `<option value="${esc(p.id)}">${esc(p.name)} (${p.habitIds.length})${p.custom ? ' · custom' : ''}</option>`,
    )
    .join('')
  return `
    <div class="packs-bar">
      <label class="packs-select-wrap">
        <span class="field-label">Pack</span>
        <select id="pack-select" aria-label="Habit packs">
          <option value="">Add pack to active…</option>
          ${options}
        </select>
      </label>
      <button type="button" class="primary" data-action="apply-pack-select">Add to active</button>
      <button type="button" class="ghost" data-action="new-pack">+ Pack</button>
      <button type="button" class="ghost" data-action="manage-pack">Edit pack</button>
    </div>
  `
}

function renderRadarStrip(selected: Habit[]): string {
  const scores = categoryScores(selected)
  const weak = weakestCategory(scores)
  const weakColor = weak ? CATEGORY_COLORS[weak] : undefined
  return `
    <section class="panel radar-strip">
      <div class="radar-strip-inner">
        <div class="radar-compact">${renderRadarSvg({ scores, width: 260, height: 240 })}</div>
        <div class="radar-side">
          <h2>Balance <span class="muted-inline">max ${RADAR_MAX}</span></h2>
          <p class="radar-meta">
            ${
              selected.length === 0
                ? 'Activate habits or add a pack'
                : weak
                  ? `Weakest: <strong style="color:${weakColor}">${esc(CATEGORY_LABELS[weak])}</strong> · ${selected.length} active`
                  : `${selected.length} active`
            }
          </p>
        </div>
      </div>
    </section>
  `
}

// ── Plan grid ──────────────────────────────────────────────────

function renderPlanCell(
  entry: ActiveHabitEntry,
  hits: number,
  target: number,
): string {
  const h = getHabit(entry.habitId)
  if (!h) return ''
  const fill = target > 0 ? Math.min(100, Math.round((hits / target) * 100)) : 0
  const color = CATEGORY_COLORS[h.category]
  const timeLabel =
    h.timeEstimateMinutes <= 0
      ? 'rule'
      : `~${formatMinutes(h.timeEstimateMinutes)}`
  const stageClass = entry.stage === 'forming' ? 'is-forming' : 'is-formed'
  const doneClass = fill >= 100 ? 'is-complete' : ''

  return `
    <article class="plan-cell ${stageClass} ${doneClass}" style="--cat:${color}; border-color:${color}55" data-habit-id="${esc(h.id)}">
      <div class="plan-cell-fill" style="height:${fill}%; background:${color}"></div>
      <div class="plan-cell-body">
        <div class="plan-cell-top">
          <span class="plan-hits" title="Hits this week / weekly target">${hits}/${target}</span>
          <span class="stage-chip ${stageClass}">${entry.stage === 'forming' ? 'forming' : 'formed'}</span>
        </div>
        <button type="button" class="plan-name linkish" data-action="view-habit" data-habit-id="${esc(h.id)}" title="Why & How">${esc(h.name)}</button>
        <div class="plan-meta">
          <span class="plan-time" title="Session time estimate">${esc(timeLabel)}</span>
          <span class="plan-cadence" title="${esc(FREQUENCY_LABELS[h.frequency])}">${cadenceTag(h.frequency)}</span>
        </div>
        <div class="plan-controls">
          <div class="ctrl-group" title="Log hits">
            <button type="button" class="icon tiny" data-action="hit-minus" data-habit-id="${esc(h.id)}" aria-label="Undo hit">−</button>
            <button type="button" class="icon tiny" data-action="hit-plus" data-habit-id="${esc(h.id)}" aria-label="Log hit today">+</button>
          </div>
          <div class="ctrl-group" title="Weekly target">
            <button type="button" class="icon tiny" data-action="tgt-minus" data-habit-id="${esc(h.id)}" aria-label="Lower weekly target">tgt−</button>
            <button type="button" class="icon tiny" data-action="tgt-plus" data-habit-id="${esc(h.id)}" aria-label="Raise weekly target">tgt+</button>
          </div>
          <div class="ctrl-group plan-manage">
            ${
              entry.stage === 'forming'
                ? `<button type="button" class="ghost tiny" data-action="mark-formed" data-habit-id="${esc(h.id)}">✓</button>`
                : `<button type="button" class="ghost tiny" data-action="mark-forming" data-habit-id="${esc(h.id)}">↻</button>`
            }
            <button type="button" class="ghost tiny danger-text" data-action="deactivate" data-habit-id="${esc(h.id)}" aria-label="Remove">✕</button>
          </div>
        </div>
      </div>
    </article>
  `
}

function renderActivePlan(weekKey: string): string {
  const entries = orderedActiveEntries()
  const formingN = entries.filter((e) => e.stage === 'forming').length
  const formedN = entries.filter((e) => e.stage === 'formed').length
  const dateKeys = weekDateKeys(weekKey)
  const checks = loadChecksForDates(dateKeys)
  const habits = getHabitsByIds(entries.map((e) => e.habitId))
  const targets = targetMap(entries)
  const pct = weekConsistencyPercent(habits, checks, dateKeys, targets)
  const formingWarn =
    formingN > FORMING_SOFT_MAX
      ? `<span class="time-warn"> · ${formingN} forming (aim ~${FORMING_SOFT_MAX})</span>`
      : ''

  const cells =
    entries.length === 0
      ? `<p class="empty plan-empty">No active habits — pick a pack or Activate from the library. Click a name anytime for Why &amp; How.</p>`
      : `<div class="plan-grid">
          ${entries
            .map((e) => {
              const hits = countHitsInWeek(e.habitId, checks, dateKeys)
              const target = getEntryWeeklyTarget(e)
              return renderPlanCell(e, hits, target)
            })
            .join('')}
        </div>`

  return `
    <section class="panel active-panel">
      <div class="panel-title-row">
        <h2>Active plan
          <span class="muted-inline">Forming ${formingN} · Formed ${formedN}${formingWarn}</span>
        </h2>
        <div class="week-nav compact">
          <button type="button" class="icon" data-action="week-prev" aria-label="Previous week">‹</button>
          <span class="week-label">${esc(formatWeekLabel(weekKey))}</span>
          <button type="button" class="icon" data-action="week-next" aria-label="Next week">›</button>
          <button type="button" class="ghost tiny" data-action="week-today">This week</button>
          <strong class="week-pct" title="Check-in consistency">${pct}%</strong>
        </div>
      </div>
      ${cells}
    </section>
  `
}

function renderProgressOverview(weekKey: string): string {
  const keys = recentWeekKeys(weekKey, 8)
  const entries = getActiveEntries()
  const habits = getHabitsByIds(entries.map((e) => e.habitId))
  const targets = targetMap(entries)

  const cols = keys
    .map((k) => {
      const dates = weekDateKeys(k)
      const checks = loadChecksForDates(dates)
      const pct =
        habits.length === 0
          ? 0
          : weekConsistencyPercent(habits, checks, dates, targets)
      const short = k.slice(-2)
      const isCurrent = k === weekKey
      return `
        <div class="trend-col" title="${esc(k)}: ${pct}%">
          <div class="trend-bar ${isCurrent ? 'current' : ''}" style="height:${Math.max(2, pct)}%"></div>
          <span class="trend-label">W${short}<br/>${pct}%</span>
        </div>`
    })
    .join('')

  return `
    <section class="section panel">
      <h2>Progress overview</h2>
      <div class="trend">${cols}</div>
    </section>
  `
}

// ── Library ────────────────────────────────────────────────────

function renderLibrary(activeIds: Set<string>): string {
  const habits = getHabits()
  const chips = [
    `<button type="button" class="chip ${filterCategory === 'all' ? 'active' : ''}" data-action="filter" data-category="all">All</button>`,
    ...CATEGORIES.map((c) => {
      const color = CATEGORY_COLORS[c]
      const active = filterCategory === c
      const style = active
        ? `border-color:${color};color:${color};background:${color}22`
        : `border-color:transparent;color:${color}`
      return `<button type="button" class="chip ${active ? 'active' : ''}" style="${style}" data-action="filter" data-category="${c}">${esc(CATEGORY_LABELS[c])}</button>`
    }),
  ].join('')

  const list = habits.filter(
    (h) => filterCategory === 'all' || h.category === filterCategory,
  )

  const cards = list
    .map((h) => {
      const on = activeIds.has(h.id)
      const color = CATEGORY_COLORS[h.category]
      const custom = isCustomHabit(h.id)
      const hub = h.secondaryTags?.includes('huberman')
      return `
        <article class="habit-card ${on ? 'selected' : ''}" style="${on ? `border-color:${color};box-shadow:inset 0 0 0 1px ${color}44` : catBorder(h.category)}">
          <header>
            <h3>
              <button type="button" class="linkish title-btn" data-action="view-habit" data-habit-id="${esc(h.id)}">${esc(h.name)}</button>
              ${hub ? ' <em class="badge-custom">huberman</em>' : ''}
              ${custom ? ' <em class="badge-custom">custom</em>' : ''}
            </h3>
            <span class="cat-badge" style="${catStyle(h.category)}">${esc(CATEGORY_LABELS[h.category])}</span>
          </header>
          <div class="habit-stats">
            <span>${esc(FREQUENCY_LABELS[h.frequency])}</span>
            <span>${h.timeEstimateMinutes <= 0 ? 'rule' : `~${formatMinutes(h.timeEstimateMinutes)}`}</span>
          </div>
          <footer class="habit-footer">
            <div class="habit-footer-left">
              <button type="button" class="ghost" data-action="view-habit" data-habit-id="${esc(h.id)}">Why / How</button>
              <button type="button" class="ghost" data-action="edit-habit" data-habit-id="${esc(h.id)}">Edit</button>
              ${
                custom
                  ? `<button type="button" class="ghost danger-text" data-action="delete-habit" data-habit-id="${esc(h.id)}">Delete</button>`
                  : ''
              }
            </div>
            <button type="button" class="${on ? '' : 'primary'}" data-action="toggle-active" data-habit-id="${esc(h.id)}">
              ${on ? 'Remove' : 'Activate'}
            </button>
          </footer>
        </article>`
    })
    .join('')

  return `
    <section class="section">
      <div class="section-head">
        <h2>Library <span class="muted-inline">(${list.length})</span></h2>
        <div class="section-head-actions">
          <button type="button" class="primary" data-action="new-habit">+ Habit</button>
          <div class="chips">${chips}</div>
        </div>
      </div>
      <div class="habit-grid">${cards}</div>
    </section>
  `
}

// ── Modals (Why / How view is first-class) ─────────────────────

function renderHabitViewModal(): string {
  if (!modal || modal.kind !== 'habit-view') return ''
  const h = getHabit(modal.habitId)
  if (!h) return ''
  const on = isActive(h.id)
  const d = h.difficulty
  const e = h.effect

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="habit-view-title" data-stop>
        <div class="modal-header">
          <h2 id="habit-view-title">${esc(h.name)}</h2>
          <button type="button" class="icon ghost" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <div class="modal-body">
          <span class="cat-badge" style="${catStyle(h.category)}">${esc(CATEGORY_LABELS[h.category])}</span>
          <span class="muted-inline"> · ${esc(FREQUENCY_LABELS[h.frequency])} · ${h.timeEstimateMinutes <= 0 ? 'rule' : `~${formatMinutes(h.timeEstimateMinutes)}`}</span>
          <div class="detail-block" style="margin-top:1rem">
            <span class="field-label">Why</span>
            <p class="view-prose">${esc(whyText(h))}</p>
          </div>
          <div class="detail-block">
            <span class="field-label">How</span>
            <p class="how-steps view-prose">${formatHowHtml(h.how || '—')}</p>
          </div>
          <div class="detail-block">
            <span class="field-label">Dose</span>
            <p class="view-prose"><strong>MED:</strong> ${esc(h.med || '—')}<br/><strong>High intensity:</strong> ${esc(h.highIntensity || '—')}</p>
          </div>
          <p class="habit-stats">Diff T${d.time}/W${d.willpower}/E${d.energy} · Eff S${e.shortTerm}/L${e.longTerm}/I${e.identity}</p>
        </div>
        <div class="modal-footer modal-footer-pad">
          <button type="button" class="ghost" data-action="edit-habit" data-habit-id="${esc(h.id)}">Edit</button>
          <div class="modal-footer-right">
            <button type="button" class="ghost" data-action="close-modal">Close</button>
            <button type="button" class="${on ? '' : 'primary'}" data-action="toggle-active" data-habit-id="${esc(h.id)}">${on ? 'Remove from active' : 'Activate'}</button>
          </div>
        </div>
      </div>
    </div>
  `
}

function numInput(
  name: string,
  label: string,
  value: number,
  min = 1,
  max = 10,
): string {
  return `
    <label class="field">
      <span>${esc(label)}</span>
      <input type="number" name="${esc(name)}" min="${min}" max="${max}" value="${value}" required />
    </label>`
}

function renderHabitEditModal(): string {
  if (!modal || modal.kind !== 'habit-edit') return ''
  const editId = modal.habitId
  const isNew = editId === null
  const habit = isNew
    ? emptyHabitDraft()
    : (getHabit(editId) ?? emptyHabitDraft())
  const canDelete = !isNew && isCustomHabit(habit.id)
  const catOptions = CATEGORIES.map(
    (c) =>
      `<option value="${c}" ${habit.category === c ? 'selected' : ''}>${esc(CATEGORY_LABELS[c])}</option>`,
  ).join('')
  const freqOptions = FREQUENCIES.map(
    (f) =>
      `<option value="${f}" ${habit.frequency === f ? 'selected' : ''}>${esc(FREQUENCY_LABELS[f])}</option>`,
  ).join('')

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal" role="dialog" aria-modal="true" data-stop>
        <div class="modal-header">
          <h2>${isNew ? 'New habit' : 'Edit habit'}</h2>
          <button type="button" class="icon ghost" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <form id="habit-form" class="modal-form">
          <input type="hidden" name="id" value="${esc(habit.id)}" />
          <label class="field"><span>Name</span>
            <input type="text" name="name" value="${esc(habit.name)}" required maxlength="80" /></label>
          <label class="field"><span>Why</span>
            <textarea name="description" rows="2" required maxlength="500">${esc(whyText(habit))}</textarea></label>
          <label class="field"><span>How (steps)</span>
            <textarea name="how" rows="4" required maxlength="1200">${esc(habit.how)}</textarea></label>
          <div class="field-row">
            <label class="field"><span>Category</span><select name="category">${catOptions}</select></label>
            <label class="field"><span>Frequency</span><select name="frequency">${freqOptions}</select></label>
            <label class="field"><span>Time (min)</span>
              <input type="number" name="timeEstimateMinutes" min="0" max="600" value="${habit.timeEstimateMinutes}" required /></label>
          </div>
          <fieldset class="field-group"><legend>Difficulty</legend>
            <div class="field-row">
              ${numInput('diffTime', 'Time', habit.difficulty.time)}
              ${numInput('diffWillpower', 'Willpower', habit.difficulty.willpower)}
              ${numInput('diffEnergy', 'Energy', habit.difficulty.energy)}
            </div>
          </fieldset>
          <fieldset class="field-group"><legend>Effect</legend>
            <div class="field-row">
              ${numInput('effShort', 'Short', habit.effect.shortTerm)}
              ${numInput('effLong', 'Long', habit.effect.longTerm)}
              ${numInput('effIdentity', 'Identity', habit.effect.identity)}
            </div>
          </fieldset>
          <label class="field"><span>MED</span><input type="text" name="med" value="${esc(habit.med)}" /></label>
          <label class="field"><span>High intensity</span><input type="text" name="highIntensity" value="${esc(habit.highIntensity)}" /></label>
          <div class="modal-footer">
            ${canDelete ? `<button type="button" class="ghost danger-text" data-action="delete-habit" data-habit-id="${esc(habit.id)}">Delete</button>` : '<span></span>'}
            <div class="modal-footer-right">
              <button type="button" class="ghost" data-action="close-modal">Cancel</button>
              <button type="submit" class="primary">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
}

function renderPackModal(): string {
  if (!modal || modal.kind !== 'pack') return ''
  const editId = modal.packId
  const isNew = editId === null
  const activeIds = getActiveEntries().map((e) => e.habitId)
  const pack: Pack = isNew
    ? {
        id: '',
        name: '',
        description: '',
        habitIds: activeIds.slice(0, 6),
        custom: true,
      }
    : (getPack(editId) ?? {
        id: '',
        name: '',
        description: '',
        habitIds: [],
        custom: true,
      })
  if (!isNew && !pack.custom) return ''

  const selected = new Set(pack.habitIds)
  const checks = getHabits()
    .map((h) => {
      const checked = selected.has(h.id) ? 'checked' : ''
      return `
        <label class="check-row">
          <input type="checkbox" name="habitIds" value="${esc(h.id)}" ${checked} />
          <span class="cat-dot" style="background:${CATEGORY_COLORS[h.category]}"></span>
          <span class="check-label">${esc(h.name)}</span>
        </label>`
    })
    .join('')

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-wide" role="dialog" aria-modal="true" data-stop>
        <div class="modal-header">
          <h2>${isNew ? 'New pack (aim ~6 habits)' : 'Edit pack'}</h2>
          <button type="button" class="icon ghost" data-action="close-modal">✕</button>
        </div>
        <form id="pack-form" class="modal-form">
          <input type="hidden" name="id" value="${esc(pack.id)}" />
          <label class="field"><span>Name</span><input type="text" name="name" value="${esc(pack.name)}" required /></label>
          <label class="field"><span>Description</span><input type="text" name="description" value="${esc(pack.description)}" /></label>
          <fieldset class="field-group pack-habits"><legend>Habits</legend>
            <div class="check-list">${checks}</div>
          </fieldset>
          <div class="modal-footer">
            ${!isNew ? `<button type="button" class="ghost danger-text" data-action="delete-pack" data-pack-id="${esc(pack.id)}">Delete</button>` : '<span></span>'}
            <div class="modal-footer-right">
              <button type="button" class="ghost" data-action="close-modal">Cancel</button>
              <button type="submit" class="primary">Save pack</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
}

// ── App ────────────────────────────────────────────────────────

export function renderApp(root: HTMLElement): void {
  const weekKey = getOverviewWeek()
  const entries = getActiveEntries()
  const activeIds = new Set(entries.map((e) => e.habitId))
  const activeHabits = getHabitsByIds(entries.map((e) => e.habitId))

  root.innerHTML = `
    ${renderHeader()}
    ${renderPacksBar()}
    ${renderRadarStrip(activeHabits)}
    ${renderActivePlan(weekKey)}
    ${renderProgressOverview(weekKey)}
    ${renderLibrary(activeIds)}
    ${renderHabitViewModal()}
    ${renderHabitEditModal()}
    ${renderPackModal()}
  `

  bindEvents(root, weekKey)

  if (modal) {
    root
      .querySelector<HTMLElement>(
        '.modal input:not([type="hidden"]), .modal textarea, .modal button.primary',
      )
      ?.focus()
  }
}

function readHabitForm(form: HTMLFormElement): Habit | null {
  const fd = new FormData(form)
  const name = String(fd.get('name') ?? '').trim()
  if (!name) return null
  let id = String(fd.get('id') ?? '').trim()
  if (!id) id = uniqueHabitId(name)
  const category = String(fd.get('category')) as Category
  if (!CATEGORIES.includes(category)) return null
  const frequency = String(fd.get('frequency')) as Frequency
  if (!FREQUENCIES.includes(frequency)) return null
  const existing = getHabit(id)
  const why = String(fd.get('description') ?? '').trim()
  const how = String(fd.get('how') ?? '').trim()
  return {
    id,
    name,
    description: why.startsWith('Why:') ? why : why ? `Why: ${why}` : '',
    how,
    category,
    secondaryTags: existing?.secondaryTags ?? [],
    difficulty: {
      time: clampScore(Number(fd.get('diffTime'))),
      willpower: clampScore(Number(fd.get('diffWillpower'))),
      energy: clampScore(Number(fd.get('diffEnergy'))),
    },
    effect: {
      shortTerm: clampScore(Number(fd.get('effShort'))),
      longTerm: clampScore(Number(fd.get('effLong'))),
      identity: clampScore(Number(fd.get('effIdentity'))),
    },
    med: String(fd.get('med') ?? '').trim(),
    highIntensity: String(fd.get('highIntensity') ?? '').trim(),
    frequency,
    timeEstimateMinutes: Math.max(
      0,
      Math.min(600, Math.round(Number(fd.get('timeEstimateMinutes')) || 0)),
    ),
    source: isCoreHabit(id) ? (existing?.source ?? 'core') : 'local',
  }
}

function readPackForm(form: HTMLFormElement): Pack | null {
  const fd = new FormData(form)
  const name = String(fd.get('name') ?? '').trim()
  if (!name) return null
  let id = String(fd.get('id') ?? '').trim()
  if (!id) id = uniquePackId(name)
  return {
    id,
    name,
    description: String(fd.get('description') ?? '').trim(),
    habitIds: fd
      .getAll('habitIds')
      .map((v) => String(v))
      .filter(Boolean),
    custom: true,
  }
}

function bindEvents(root: HTMLElement, weekKey: string): void {
  const rerender = () => renderApp(root)
  const dateKeys = weekDateKeys(weekKey)
  const today = todayKey()

  if (escapeHandler) document.removeEventListener('keydown', escapeHandler)
  escapeHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && modal) {
      modal = null
      rerender()
    }
  }
  document.addEventListener('keydown', escapeHandler)

  root.querySelector('[data-action="week-prev"]')?.addEventListener('click', () => {
    setOverviewWeek(shiftWeek(weekKey, -1))
    rerender()
  })
  root.querySelector('[data-action="week-next"]')?.addEventListener('click', () => {
    setOverviewWeek(shiftWeek(weekKey, 1))
    rerender()
  })
  root.querySelector('[data-action="week-today"]')?.addEventListener('click', () => {
    setOverviewWeek(isoWeekKey())
    rerender()
  })

  root.querySelector('[data-action="export"]')?.addEventListener('click', () => {
    downloadExport()
    showToast('Export downloaded', 'ok')
  })

  const fileInput = root.querySelector<HTMLInputElement>('#import-file')
  root.querySelector('[data-action="import"]')?.addEventListener('click', () => {
    fileInput?.click()
  })
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0]
    if (!file) return
    try {
      const blob = JSON.parse(await file.text()) as ExportBlob
      if (blob.version !== 1) throw new Error('Unsupported export version')
      importAll(blob)
      showToast('Import complete', 'ok')
      rerender()
    } catch (e) {
      showToast(
        `Import failed: ${e instanceof Error ? e.message : String(e)}`,
        'error',
      )
    } finally {
      fileInput.value = ''
    }
  })

  root.querySelectorAll('[data-action="close-modal"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      if (
        (el as HTMLElement).classList.contains('modal-backdrop') &&
        ev.target !== el
      ) {
        return
      }
      modal = null
      rerender()
    })
  })
  root.querySelectorAll('[data-stop]').forEach((el) => {
    el.addEventListener('click', (ev) => ev.stopPropagation())
  })

  root
    .querySelector('[data-action="apply-pack-select"]')
    ?.addEventListener('click', () => {
      const id = root.querySelector<HTMLSelectElement>('#pack-select')?.value
      if (!id) {
        showToast('Choose a pack first', 'error')
        return
      }
      const added = applyPackToActive(id)
      const pack = getPack(id)
      showToast(
        added > 0
          ? `Added ${added} from ${pack?.name ?? 'pack'} — remove any you do not want`
          : 'All pack habits already active',
        added > 0 ? 'ok' : 'info',
      )
      rerender()
    })

  root.querySelector('[data-action="new-pack"]')?.addEventListener('click', () => {
    modal = { kind: 'pack', packId: null }
    rerender()
  })
  root.querySelector('[data-action="manage-pack"]')?.addEventListener('click', () => {
    const id = root.querySelector<HTMLSelectElement>('#pack-select')?.value
    if (!id) {
      showToast('Choose a pack', 'error')
      return
    }
    const pack = getPack(id)
    if (!pack?.custom) {
      showToast('Built-in packs are fixed — create a custom pack to edit', 'error')
      return
    }
    modal = { kind: 'pack', packId: id }
    rerender()
  })

  root.querySelectorAll('[data-action="view-habit"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      modal = { kind: 'habit-view', habitId: id }
      rerender()
    })
  })

  root.querySelector('[data-action="new-habit"]')?.addEventListener('click', () => {
    modal = { kind: 'habit-edit', habitId: null }
    rerender()
  })
  root.querySelectorAll('[data-action="edit-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      modal = { kind: 'habit-edit', habitId: id }
      rerender()
    })
  })

  root.querySelectorAll('[data-action="hit-plus"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      if (logHitToday(id, today)) showToast('Logged for today', 'ok')
      else showToast('Already logged today', 'info')
      rerender()
    })
  })
  root.querySelectorAll('[data-action="hit-minus"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      if (undoHitInWeek(id, today, dateKeys)) showToast('Hit undone', 'ok')
      else showToast('No hits to undo this week', 'info')
      rerender()
    })
  })
  root.querySelectorAll('[data-action="tgt-plus"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      bumpActiveWeeklyTarget(id, 1)
      rerender()
    })
  })
  root.querySelectorAll('[data-action="tgt-minus"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation()
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      bumpActiveWeeklyTarget(id, -1)
      rerender()
    })
  })

  root.querySelectorAll('[data-action="mark-formed"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      setHabitStage(id, 'formed')
      showToast('Marked formed', 'ok')
      rerender()
    })
  })
  root.querySelectorAll('[data-action="mark-forming"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      setHabitStage(id, 'forming')
      rerender()
    })
  })
  root.querySelectorAll('[data-action="deactivate"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      removeActiveHabit(id)
      showToast('Removed from active', 'ok')
      rerender()
    })
  })

  root.querySelectorAll('[data-action="toggle-active"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      if (isActive(id)) {
        removeActiveHabit(id)
        showToast('Removed from active', 'ok')
      } else {
        addActiveHabit(id, 'forming')
        const n = getActiveEntries().filter((e) => e.stage === 'forming').length
        showToast(
          n > FORMING_SOFT_MAX
            ? `Activated (${n} forming — aim ~${FORMING_SOFT_MAX})`
            : 'Added as forming',
          n > FORMING_SOFT_MAX ? 'info' : 'ok',
        )
      }
      rerender()
    })
  })

  root.querySelectorAll('[data-action="delete-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id || !confirm('Delete this custom habit?')) return
      if (!deleteHabit(id)) {
        showToast('Core habits cannot be deleted', 'error')
        return
      }
      modal = null
      showToast('Deleted', 'ok')
      rerender()
    })
  })
  root.querySelectorAll('[data-action="delete-pack"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.packId
      if (!id || !confirm('Delete custom pack?')) return
      deletePack(id)
      modal = null
      rerender()
    })
  })

  root.querySelector<HTMLFormElement>('#habit-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const form = ev.target as HTMLFormElement
    const habit = readHabitForm(form)
    if (!habit?.description || !habit.how) {
      showToast('Why and How are required', 'error')
      return
    }
    saveHabit(habit)
    modal = { kind: 'habit-view', habitId: habit.id }
    showToast('Saved', 'ok')
    rerender()
  })

  root.querySelector<HTMLFormElement>('#pack-form')?.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const pack = readPackForm(ev.target as HTMLFormElement)
    if (!pack || pack.habitIds.length === 0) {
      showToast('Name + at least one habit', 'error')
      return
    }
    savePack(pack)
    modal = null
    showToast('Pack saved', 'ok')
    rerender()
  })

  root.querySelectorAll('[data-action="filter"]').forEach((el) => {
    el.addEventListener('click', () => {
      filterCategory = (el as HTMLElement).dataset.category as Category | 'all'
      rerender()
    })
  })
}
