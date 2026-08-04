import {
  addActiveHabit,
  applyPackToActive,
  deleteHabit,
  deletePack,
  downloadExport,
  getActiveEntries,
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
  isDayDone,
  loadChecksForDates,
  removeActiveHabit,
  saveHabit,
  savePack,
  setDayDone,
  setHabitStage,
  setOverviewWeek,
} from './state'
import type {
  ActiveHabitEntry,
  Category,
  ExportBlob,
  Frequency,
  Habit,
  HabitStage,
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
  RADAR_MAX,
  TIME_WARN_MINUTES,
  weakestCategory,
  weekConsistencyPercent,
  weeklyTimeEstimate,
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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

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

// ── Header ─────────────────────────────────────────────────────

function renderHeader(): string {
  return `
    <header class="header">
      <div class="brand">
        <h1>Life Protocols</h1>
        <p>Active habits · balance · daily check-ins</p>
      </div>
      <div class="header-actions">
        <button type="button" data-action="export">Export</button>
        <button type="button" data-action="import">Import</button>
        <input type="file" accept="application/json,.json" class="hidden-input" id="import-file" />
      </div>
    </header>
  `
}

// ── Packs dropdown + radar ─────────────────────────────────────

function renderPacksBar(): string {
  const packs = getPacks()
  const options = packs
    .map(
      (p) =>
        `<option value="${esc(p.id)}">${esc(p.name)}${p.custom ? ' (custom)' : ''} — ${p.habitIds.length}</option>`,
    )
    .join('')
  return `
    <div class="packs-bar">
      <label class="packs-select-wrap">
        <span class="field-label">Packs</span>
        <select id="pack-select" aria-label="Starter packs">
          <option value="">Choose a pack…</option>
          ${options}
        </select>
      </label>
      <button type="button" class="primary" data-action="apply-pack-select">Add to active</button>
      <button type="button" class="ghost" data-action="new-pack">+ Custom pack</button>
      <button type="button" class="ghost" data-action="manage-pack" title="Edit selected custom pack">Edit pack</button>
    </div>
    <p class="panel-hint packs-hint">Packs add missing habits as <strong>forming</strong> (does not remove your current active set).</p>
  `
}

function renderRadarPanel(selected: Habit[]): string {
  const scores = categoryScores(selected)
  const weak = weakestCategory(scores)
  const time = weeklyTimeEstimate(selected)
  const timeLabel = formatMinutes(time)
  const warn =
    time > TIME_WARN_MINUTES
      ? `<div class="time-warn">Heavy load: ~${timeLabel}/week estimated</div>`
      : ''
  const weakColor = weak ? CATEGORY_COLORS[weak] : undefined

  return `
    <section class="panel radar-panel">
      <h2>Balance radar <span class="muted-inline">(max ${RADAR_MAX})</span></h2>
      <div class="radar-wrap">
        ${renderRadarSvg({ scores })}
        <div class="radar-meta">
          ${
            selected.length === 0
              ? 'Add active habits or apply a pack'
              : weak
                ? `Weakest: <strong style="color:${weakColor}">${esc(CATEGORY_LABELS[weak])}</strong> · ${selected.length} active · ~${timeLabel}/week`
                : `${selected.length} active · ~${timeLabel}/week`
          }
        </div>
        ${warn}
      </div>
    </section>
  `
}

// ── Active habits table ────────────────────────────────────────

function renderDayCells(
  habitId: string,
  dateKeys: string[],
  today: string,
): string {
  return dateKeys
    .map((dk, i) => {
      const checked = isDayDone(dk, habitId)
      const isToday = dk === today
      return `
        <td class="day-cell ${isToday ? 'is-today' : ''}">
          <label class="check-day" title="${esc(DAY_LABELS[i])} ${esc(dk)}">
            <input type="checkbox" data-action="toggle-day" data-habit-id="${esc(habitId)}" data-date="${esc(dk)}" ${checked ? 'checked' : ''} />
          </label>
        </td>`
    })
    .join('')
}

function renderActiveTableSection(
  title: string,
  stage: HabitStage,
  entries: ActiveHabitEntry[],
  dateKeys: string[],
  today: string,
  hint: string,
): string {
  const rows =
    entries.length === 0
      ? `<tr><td colspan="11" class="empty-row">${esc(hint)}</td></tr>`
      : entries
          .map((e) => {
            const h = getHabit(e.habitId)
            if (!h) return ''
            return `
              <tr class="active-row" style="${catBorder(h.category)}" data-habit-id="${esc(h.id)}">
                <td class="col-name">
                  <button type="button" class="linkish" data-action="view-habit" data-habit-id="${esc(h.id)}">${esc(h.name)}</button>
                </td>
                <td class="col-cat"><span class="cat-badge" style="${catStyle(h.category)}">${esc(CATEGORY_LABELS[h.category])}</span></td>
                <td class="col-freq muted-cell">${esc(FREQUENCY_LABELS[h.frequency])}</td>
                ${renderDayCells(h.id, dateKeys, today)}
                <td class="col-actions">
                  ${
                    stage === 'forming'
                      ? `<button type="button" class="ghost tiny" data-action="mark-formed" data-habit-id="${esc(h.id)}" title="Mark as formed">Formed ✓</button>`
                      : `<button type="button" class="ghost tiny" data-action="mark-forming" data-habit-id="${esc(h.id)}" title="Move back to forming">Forming</button>`
                  }
                  <button type="button" class="ghost tiny danger-text" data-action="deactivate" data-habit-id="${esc(h.id)}" title="Remove from active">✕</button>
                </td>
              </tr>`
          })
          .join('')

  const formingNote =
    stage === 'forming' && entries.length > FORMING_SOFT_MAX
      ? `<p class="time-warn">You have ${entries.length} forming habits — aim for about ${FORMING_SOFT_MAX}.</p>`
      : stage === 'forming'
        ? `<p class="panel-hint">${entries.length} / ~${FORMING_SOFT_MAX} suggested</p>`
        : ''

  return `
    <div class="table-section">
      <div class="table-section-head">
        <h3>${esc(title)} <span class="count-pill" style="--pill:${stage === 'forming' ? '#e0a458' : 'var(--accent)'}">${entries.length}</span></h3>
        ${formingNote}
      </div>
      <div class="table-scroll">
        <table class="active-table">
          <thead>
            <tr>
              <th class="col-name">Habit</th>
              <th class="col-cat">Category</th>
              <th class="col-freq">Freq</th>
              ${DAY_LABELS.map((d, i) => `<th class="day-head ${dateKeys[i] === today ? 'is-today' : ''}">${d}</th>`).join('')}
              <th class="col-actions"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `
}

function renderActiveHabits(weekKey: string): string {
  const entries = getActiveEntries()
  const formed = entries.filter((e) => e.stage === 'formed')
  const forming = entries.filter((e) => e.stage === 'forming')
  const dateKeys = weekDateKeys(weekKey)
  const today = todayKey()
  const habits = getHabitsByIds(entries.map((e) => e.habitId))
  const checks = loadChecksForDates(dateKeys)
  const pct = weekConsistencyPercent(habits, checks, dateKeys)

  return `
    <section class="panel active-panel">
      <div class="panel-title-row">
        <h2>Active habits</h2>
        <div class="week-nav compact">
          <button type="button" class="icon" data-action="week-prev" aria-label="Previous week">‹</button>
          <span class="week-label">${esc(formatWeekLabel(weekKey))}</span>
          <button type="button" class="icon" data-action="week-next" aria-label="Next week">›</button>
          <button type="button" class="ghost tiny" data-action="week-today">This week</button>
        </div>
      </div>
      <p class="panel-hint">Sticky set you live by — not rebuilt every week. Check boxes for each day. Radar uses all active habits.</p>
      <div class="consistency-bar">
        <div class="row">
          <span>This week’s check-ins</span>
          <strong>${pct}%</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
      ${renderActiveTableSection('Formed', 'formed', formed, dateKeys, today, 'No formed habits yet — promote from Forming when stable.')}
      ${renderActiveTableSection('Forming', 'forming', forming, dateKeys, today, 'Add from the library or a pack. Aim for ~6 forming at a time.')}
    </section>
  `
}

// ── Progress overview ──────────────────────────────────────────

function renderProgressOverview(weekKey: string): string {
  const keys = recentWeekKeys(weekKey, 8)
  const entries = getActiveEntries()
  const habits = getHabitsByIds(entries.map((e) => e.habitId))

  const cols = keys
    .map((k) => {
      const dates = weekDateKeys(k)
      const checks = loadChecksForDates(dates)
      const pct =
        habits.length === 0
          ? 0
          : weekConsistencyPercent(habits, checks, dates)
      const short = k.slice(-2)
      const isCurrent = k === weekKey
      return `
        <div class="trend-col" title="${esc(k)}: ${pct}%">
          <div class="trend-bar ${isCurrent ? 'current' : ''}" style="height:${Math.max(2, pct)}%"></div>
          <span class="trend-label">W${short}<br/>${pct}%</span>
        </div>`
    })
    .join('')

  // Per-habit hits this week
  const dateKeys = weekDateKeys(weekKey)
  const checks = loadChecksForDates(dateKeys)
  const habitRows =
    habits.length === 0
      ? `<p class="empty">No active habits to summarize.</p>`
      : `<ul class="overview-list">
          ${habits
            .map((h) => {
              let hits = 0
              for (const d of dateKeys) if (checks[d]?.[h.id]) hits++
              const target = h.frequency === 'daily' ? 7 : h.frequency === 'several_per_week' ? 3 : 1
              return `<li>
                <span class="cat-dot" style="background:${CATEGORY_COLORS[h.category]}"></span>
                ${esc(h.name)}
                <strong>${hits}/${target}</strong>
              </li>`
            })
            .join('')}
        </ul>`

  return `
    <section class="section panel">
      <h2>Progress overview</h2>
      <p class="panel-hint">Last 8 weeks of check-in consistency for your current active set. Switch week above the active table to inspect a specific week.</p>
      <div class="trend">${cols}</div>
      <h3 class="subhead">Hits this week</h3>
      ${habitRows}
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
      return `
        <article class="habit-card ${on ? 'selected' : ''}" style="${on ? `border-color:${color};box-shadow:inset 0 0 0 1px ${color}44` : catBorder(h.category)}">
          <header>
            <h3>
              <button type="button" class="linkish title-btn" data-action="view-habit" data-habit-id="${esc(h.id)}">${esc(h.name)}</button>
              ${custom ? ' <em class="badge-custom">custom</em>' : ''}
            </h3>
            <span class="cat-badge" style="${catStyle(h.category)}">${esc(CATEGORY_LABELS[h.category])}</span>
          </header>
          <div class="habit-why">
            <span class="field-label">Why</span>
            <p>${esc(whyText(h).slice(0, 140))}${whyText(h).length > 140 ? '…' : ''}</p>
          </div>
          <div class="habit-stats">
            <span>${esc(FREQUENCY_LABELS[h.frequency])}</span>
            <span>${formatMinutes(h.timeEstimateMinutes)}</span>
          </div>
          <footer class="habit-footer">
            <div class="habit-footer-left">
              <button type="button" class="ghost" data-action="view-habit" data-habit-id="${esc(h.id)}">View</button>
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
        <h2>Master library <span style="color:var(--muted);font-weight:400">(${list.length})</span></h2>
        <div class="section-head-actions">
          <button type="button" class="primary" data-action="new-habit">+ Habit</button>
          <div class="chips">${chips}</div>
        </div>
      </div>
      <p class="panel-hint">Click a habit name to open <strong>Why</strong> and <strong>How</strong> (view mode).</p>
      <div class="habit-grid">${cards}</div>
    </section>
  `
}

// ── Modals ─────────────────────────────────────────────────────

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
          <span class="muted-inline"> · ${esc(FREQUENCY_LABELS[h.frequency])} · ${formatMinutes(h.timeEstimateMinutes)}</span>
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
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="habit-edit-title" data-stop>
        <div class="modal-header">
          <h2 id="habit-edit-title">${isNew ? 'New habit' : 'Edit habit'}</h2>
          <button type="button" class="icon ghost" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <form id="habit-form" class="modal-form">
          <input type="hidden" name="id" value="${esc(habit.id)}" />
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" value="${esc(habit.name)}" required maxlength="80" />
          </label>
          <label class="field">
            <span>Why (purpose)</span>
            <textarea name="description" rows="2" required maxlength="500">${esc(whyText(habit))}</textarea>
          </label>
          <label class="field">
            <span>How (steps)</span>
            <textarea name="how" rows="4" required maxlength="1200">${esc(habit.how)}</textarea>
          </label>
          <div class="field-row">
            <label class="field">
              <span>Category</span>
              <select name="category" required>${catOptions}</select>
            </label>
            <label class="field">
              <span>Frequency</span>
              <select name="frequency" required>${freqOptions}</select>
            </label>
            <label class="field">
              <span>Time (min)</span>
              <input type="number" name="timeEstimateMinutes" min="0" max="600" value="${habit.timeEstimateMinutes}" required />
            </label>
          </div>
          <fieldset class="field-group">
            <legend>Difficulty (1–10)</legend>
            <div class="field-row">
              ${numInput('diffTime', 'Time', habit.difficulty.time)}
              ${numInput('diffWillpower', 'Willpower', habit.difficulty.willpower)}
              ${numInput('diffEnergy', 'Energy', habit.difficulty.energy)}
            </div>
          </fieldset>
          <fieldset class="field-group">
            <legend>Expected effect (1–10)</legend>
            <div class="field-row">
              ${numInput('effShort', 'Short-term', habit.effect.shortTerm)}
              ${numInput('effLong', 'Long-term', habit.effect.longTerm)}
              ${numInput('effIdentity', 'Identity', habit.effect.identity)}
            </div>
          </fieldset>
          <label class="field">
            <span>Minimum effective dose</span>
            <input type="text" name="med" value="${esc(habit.med)}" maxlength="200" />
          </label>
          <label class="field">
            <span>High-intensity version</span>
            <input type="text" name="highIntensity" value="${esc(habit.highIntensity)}" maxlength="200" />
          </label>
          <div class="modal-footer">
            ${
              canDelete
                ? `<button type="button" class="ghost danger-text" data-action="delete-habit" data-habit-id="${esc(habit.id)}">Delete</button>`
                : `<span></span>`
            }
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
        habitIds: activeIds.slice(),
        custom: true,
      }
    : (getPack(editId) ?? {
        id: '',
        name: '',
        description: '',
        habitIds: [],
        custom: true,
      })

  if (!isNew && !pack.custom) {
    return ''
  }

  const habits = getHabits()
  const selected = new Set(pack.habitIds)
  const checks = habits
    .map((h) => {
      const checked = selected.has(h.id) ? 'checked' : ''
      return `
        <label class="check-row">
          <input type="checkbox" name="habitIds" value="${esc(h.id)}" ${checked} />
          <span class="cat-dot" style="background:${CATEGORY_COLORS[h.category]}"></span>
          <span class="check-label">${esc(h.name)}</span>
          <span class="check-meta">${esc(CATEGORY_LABELS[h.category])}</span>
        </label>`
    })
    .join('')

  return `
    <div class="modal-backdrop" data-action="close-modal">
      <div class="modal modal-wide" role="dialog" aria-modal="true" data-stop>
        <div class="modal-header">
          <h2>${isNew ? 'New custom pack' : 'Edit pack'}</h2>
          <button type="button" class="icon ghost" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <form id="pack-form" class="modal-form">
          <input type="hidden" name="id" value="${esc(pack.id)}" />
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" value="${esc(pack.name)}" required maxlength="60" />
          </label>
          <label class="field">
            <span>Description</span>
            <input type="text" name="description" value="${esc(pack.description)}" maxlength="200" />
          </label>
          <fieldset class="field-group pack-habits">
            <legend>Habits in pack</legend>
            <div class="check-list">${checks}</div>
          </fieldset>
          <div class="modal-footer">
            ${
              !isNew
                ? `<button type="button" class="ghost danger-text" data-action="delete-pack" data-pack-id="${esc(pack.id)}">Delete</button>`
                : `<span></span>`
            }
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
    <div class="top-grid two-col">
      ${renderRadarPanel(activeHabits)}
      <div class="panel meta-side">
        <h2>How this works</h2>
        <ol class="howto-list">
          <li><strong>Activate</strong> habits from the library (or a pack).</li>
          <li>Keep ~<strong>${FORMING_SOFT_MAX} forming</strong>; promote to <strong>formed</strong> when stable.</li>
          <li><strong>Check days</strong> in the table as you complete them.</li>
          <li>Use <strong>overview</strong> for multi-week consistency.</li>
        </ol>
      </div>
    </div>
    ${renderActiveHabits(weekKey)}
    ${renderProgressOverview(weekKey)}
    ${renderLibrary(activeIds)}
    ${renderHabitViewModal()}
    ${renderHabitEditModal()}
    ${renderPackModal()}
  `

  bindEvents(root, weekKey)

  if (modal) {
    const first = root.querySelector<HTMLElement>(
      '.modal input:not([type="hidden"]), .modal textarea, .modal select, .modal button.primary',
    )
    first?.focus()
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
  const habitIds = fd
    .getAll('habitIds')
    .map((v) => String(v))
    .filter(Boolean)
  return {
    id,
    name,
    description: String(fd.get('description') ?? '').trim(),
    habitIds,
    custom: true,
  }
}

function bindEvents(root: HTMLElement, weekKey: string): void {
  const rerender = () => renderApp(root)

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
      const text = await file.text()
      const blob = JSON.parse(text) as ExportBlob
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
      const sel = root.querySelector<HTMLSelectElement>('#pack-select')
      const id = sel?.value
      if (!id) {
        showToast('Choose a pack first', 'error')
        return
      }
      const added = applyPackToActive(id)
      const pack = getPack(id)
      showToast(
        added > 0
          ? `Added ${added} habit(s) from ${pack?.name ?? 'pack'} as forming`
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
    const sel = root.querySelector<HTMLSelectElement>('#pack-select')
    const id = sel?.value
    if (!id) {
      showToast('Choose a pack to edit', 'error')
      return
    }
    const pack = getPack(id)
    if (!pack?.custom) {
      showToast('Built-in packs cannot be edited — create a custom pack', 'error')
      return
    }
    modal = { kind: 'pack', packId: id }
    rerender()
  })

  root.querySelectorAll('[data-action="view-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
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

  root.querySelectorAll('[data-action="delete-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      if (!confirm('Delete this custom habit?')) return
      if (!deleteHabit(id)) {
        showToast('Core habits cannot be deleted', 'error')
        return
      }
      modal = null
      showToast('Habit deleted', 'ok')
      rerender()
    })
  })

  root.querySelectorAll('[data-action="delete-pack"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.packId
      if (!id) return
      if (!confirm('Delete this custom pack?')) return
      if (!deletePack(id)) {
        showToast('Built-in packs cannot be deleted', 'error')
        return
      }
      modal = null
      showToast('Pack deleted', 'ok')
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
        const forming = getActiveEntries().filter((e) => e.stage === 'forming')
        addActiveHabit(id, 'forming')
        if (forming.length + 1 > FORMING_SOFT_MAX) {
          showToast(
            `Activated (forming now ${forming.length + 1}; ~${FORMING_SOFT_MAX} suggested)`,
            'info',
          )
        } else {
          showToast('Added as forming', 'ok')
        }
      }
      // Keep view open if viewing this habit
      if (modal?.kind === 'habit-view' && modal.habitId === id) {
        /* stay */
      }
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

  root.querySelectorAll('[data-action="mark-formed"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      setHabitStage(id, 'formed')
      showToast('Marked as formed', 'ok')
      rerender()
    })
  })

  root.querySelectorAll('[data-action="mark-forming"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      setHabitStage(id, 'forming')
      showToast('Moved to forming', 'ok')
      rerender()
    })
  })

  root.querySelectorAll('[data-action="toggle-day"]').forEach((el) => {
    el.addEventListener('change', () => {
      const input = el as HTMLInputElement
      const id = input.dataset.habitId
      const date = input.dataset.date
      if (!id || !date) return
      setDayDone(date, id, input.checked)
      // Soft refresh consistency without full focus steal: full rerender ok
      rerender()
    })
  })

  const habitForm = root.querySelector<HTMLFormElement>('#habit-form')
  habitForm?.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const habit = readHabitForm(habitForm)
    if (!habit?.description) {
      showToast('Why is required', 'error')
      return
    }
    if (!habit.how) {
      showToast('How is required', 'error')
      return
    }
    saveHabit(habit)
    modal = { kind: 'habit-view', habitId: habit.id }
    showToast('Habit saved', 'ok')
    rerender()
  })

  const packForm = root.querySelector<HTMLFormElement>('#pack-form')
  packForm?.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const pack = readPackForm(packForm)
    if (!pack) {
      showToast('Please name the pack', 'error')
      return
    }
    if (pack.habitIds.length === 0) {
      showToast('Select at least one habit', 'error')
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
