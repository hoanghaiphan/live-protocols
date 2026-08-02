import {
  deleteHabit,
  deletePack,
  downloadExport,
  getActiveWeek,
  getHabit,
  getHabits,
  getHabitsByIds,
  getPack,
  getPacks,
  importAll,
  isCoreHabit,
  isCustomHabit,
  loadProgress,
  loadProtocol,
  saveHabit,
  savePack,
  saveProgress,
  saveProtocol,
  setActiveWeek,
} from './state'
import type {
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
  FREQUENCIES,
  FREQUENCY_LABELS,
  clampScore,
  slugify,
} from './types'
import {
  categoryScores,
  consistencyPercent,
  TIME_WARN_MINUTES,
  weakestCategory,
  weeklyTarget,
  weeklyTimeEstimate,
} from './scoring'
import { renderRadarSvg } from './radar'
import {
  formatWeekLabel,
  isoWeekKey,
  recentWeekKeys,
  shiftWeek,
} from './weeks'

let filterCategory: Category | 'all' = 'all'
let expandedId: string | null = null

/** Modal state: null = closed */
type ModalState =
  | null
  | { kind: 'habit'; habitId: string | null }
  | { kind: 'pack'; packId: string | null }

let modal: ModalState = null

function protocolHabits(weekKey: string): Habit[] {
  const { habitIds } = loadProtocol(weekKey)
  return getHabitsByIds(habitIds)
}

function toggleHabit(weekKey: string, habitId: string): void {
  const protocol = loadProtocol(weekKey)
  const set = new Set(protocol.habitIds)
  if (set.has(habitId)) set.delete(habitId)
  else set.add(habitId)
  saveProtocol(weekKey, { ...protocol, habitIds: [...set] })
}

function applyPack(weekKey: string, packId: string): void {
  const pack = getPack(packId)
  if (!pack) return
  saveProtocol(weekKey, { habitIds: [...pack.habitIds] })
}

function setCompletion(
  weekKey: string,
  habitId: string,
  value: number,
): void {
  const progress = loadProgress(weekKey)
  progress.completions[habitId] = Math.max(0, value)
  saveProgress(weekKey, progress)
}

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

// ── Header ─────────────────────────────────────────────────────

function renderHeader(weekKey: string): string {
  return `
    <header class="header">
      <div class="brand">
        <h1>Life Protocols</h1>
        <p>Assemble a week · balance the hex · track consistency</p>
      </div>
      <div class="header-actions">
        <div class="week-nav">
          <button type="button" class="icon" data-action="week-prev" aria-label="Previous week">‹</button>
          <span class="week-label">${esc(formatWeekLabel(weekKey))}</span>
          <button type="button" class="icon" data-action="week-next" aria-label="Next week">›</button>
          <button type="button" class="ghost" data-action="week-today">Today</button>
        </div>
        <button type="button" data-action="export">Export</button>
        <button type="button" data-action="import">Import</button>
        <input type="file" accept="application/json,.json" class="hidden-input" id="import-file" />
      </div>
    </header>
  `
}

// ── Packs ──────────────────────────────────────────────────────

function renderPacks(): string {
  const packs = getPacks()
  return `
    <section class="panel">
      <div class="panel-title-row">
        <h2>Packs</h2>
        <button type="button" class="primary" data-action="new-pack">+ Pack</button>
      </div>
      <p class="panel-hint">Apply replaces this week’s selection. Custom packs can be edited or deleted.</p>
      <div class="pack-list">
        ${packs
          .map((p) => {
            const custom = !!p.custom
            return `
          <div class="pack-row">
            <button type="button" class="pack-card" data-action="apply-pack" data-pack-id="${esc(p.id)}">
              <strong>${esc(p.name)}${custom ? ' <em class="badge-custom">custom</em>' : ''}</strong>
              <span>${esc(p.description || `${p.habitIds.length} habits`)}</span>
            </button>
            ${
              custom
                ? `<div class="pack-actions">
                    <button type="button" class="ghost" data-action="edit-pack" data-pack-id="${esc(p.id)}" title="Edit pack">Edit</button>
                    <button type="button" class="ghost danger-text" data-action="delete-pack" data-pack-id="${esc(p.id)}" title="Delete pack">Del</button>
                  </div>`
                : ''
            }
          </div>`
          })
          .join('')}
      </div>
    </section>
  `
}

// ── Radar ──────────────────────────────────────────────────────

function renderRadarPanel(selected: Habit[]): string {
  const scores = categoryScores(selected)
  const weak = weakestCategory(scores)
  const time = weeklyTimeEstimate(selected)
  const timeLabel = formatMinutes(time)
  const warn =
    time > TIME_WARN_MINUTES
      ? `<div class="time-warn">Heavy load: ~${timeLabel}/week estimated (target hits × session time)</div>`
      : ''

  const weakColor = weak ? CATEGORY_COLORS[weak] : undefined

  return `
    <section class="panel">
      <h2>Balance radar</h2>
      <div class="radar-wrap">
        ${renderRadarSvg({ scores })}
        <div class="radar-meta">
          ${
            selected.length === 0
              ? 'Select habits or apply a pack'
              : weak
                ? `Weakest axis: <strong style="color:${weakColor}">${esc(CATEGORY_LABELS[weak])}</strong> · ${selected.length} habits · ~${timeLabel}/week`
                : `${selected.length} habits · ~${timeLabel}/week`
          }
        </div>
        ${warn}
      </div>
    </section>
  `
}

// ── Protocol ───────────────────────────────────────────────────

function renderProtocol(weekKey: string, selected: Habit[]): string {
  const progress = loadProgress(weekKey)
  const pct = consistencyPercent(selected, progress.completions)

  const items =
    selected.length === 0
      ? `<p class="empty">No habits this week. Apply a pack or add from the library.</p>`
      : `<ul class="protocol-list">
          ${selected
            .map((h) => {
              const target = weeklyTarget(h)
              const done = progress.completions[h.id] ?? 0
              return `
              <li class="protocol-item" style="${catBorder(h.category)}">
                <div class="name">${esc(h.name)}</div>
                <div class="controls">
                  <button type="button" class="icon" data-action="dec" data-habit-id="${esc(h.id)}" aria-label="Decrease">−</button>
                  <span class="count">${done}/${target}</span>
                  <button type="button" class="icon" data-action="inc" data-habit-id="${esc(h.id)}" aria-label="Increase">+</button>
                  <button type="button" class="ghost" data-action="remove" data-habit-id="${esc(h.id)}" title="Remove">✕</button>
                </div>
                <div class="meta">
                  <span class="cat-dot" style="background:${CATEGORY_COLORS[h.category]}"></span>
                  ${esc(CATEGORY_LABELS[h.category])} · ${esc(FREQUENCY_LABELS[h.frequency])} · ${formatMinutes(h.timeEstimateMinutes)}
                </div>
              </li>`
            })
            .join('')}
        </ul>`

  return `
    <section class="panel">
      <h2>Weekly protocol</h2>
      ${items}
      <div class="consistency-bar">
        <div class="row">
          <span>Consistency</span>
          <strong>${pct}%</strong>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      </div>
    </section>
  `
}

// ── Library ────────────────────────────────────────────────────

function renderLibrary(selectedIds: Set<string>): string {
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
      const selected = selectedIds.has(h.id)
      const open = expandedId === h.id
      const d = h.difficulty
      const e = h.effect
      const color = CATEGORY_COLORS[h.category]
      const custom = isCustomHabit(h.id)
      return `
        <article class="habit-card ${selected ? 'selected' : ''}" data-habit-id="${esc(h.id)}" style="${selected ? `border-color:${color};box-shadow:inset 0 0 0 1px ${color}44` : catBorder(h.category)}">
          <header>
            <h3>${esc(h.name)}${custom ? ' <em class="badge-custom">custom</em>' : ''}</h3>
            <span class="cat-badge" style="${catStyle(h.category)}">${esc(CATEGORY_LABELS[h.category])}</span>
          </header>
          <p>${esc(h.description)}</p>
          <div class="habit-stats">
            <span>${esc(FREQUENCY_LABELS[h.frequency])}</span>
            <span>${formatMinutes(h.timeEstimateMinutes)}</span>
            <span>Diff T${d.time}/W${d.willpower}/E${d.energy}</span>
            <span>Eff S${e.shortTerm}/L${e.longTerm}/I${e.identity}</span>
          </div>
          ${
            open
              ? `<dl class="habit-details">
                  <div><dt>MED</dt><dd>${esc(h.med)}</dd></div>
                  <div><dt>High intensity</dt><dd>${esc(h.highIntensity)}</dd></div>
                </dl>`
              : ''
          }
          <footer class="habit-footer">
            <div class="habit-footer-left">
              <button type="button" class="ghost" data-action="toggle-details" data-habit-id="${esc(h.id)}">${open ? 'Hide' : 'Details'}</button>
              <button type="button" class="ghost" data-action="edit-habit" data-habit-id="${esc(h.id)}">Edit</button>
              ${
                custom
                  ? `<button type="button" class="ghost danger-text" data-action="delete-habit" data-habit-id="${esc(h.id)}">Delete</button>`
                  : ''
              }
            </div>
            <button type="button" class="${selected ? '' : 'primary'}" data-action="toggle-habit" data-habit-id="${esc(h.id)}">
              ${selected ? 'Remove' : 'Add'}
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
      <div class="habit-grid">${cards}</div>
    </section>
  `
}

// ── Progress ───────────────────────────────────────────────────

function renderProgress(weekKey: string): string {
  const keys = recentWeekKeys(weekKey, 8)
  const cols = keys
    .map((k) => {
      const selected = getHabitsByIds(loadProtocol(k).habitIds)
      const pct =
        selected.length === 0
          ? 0
          : consistencyPercent(selected, loadProgress(k).completions)
      const height = Math.max(2, pct)
      const short = k.slice(-2)
      const isCurrent = k === weekKey
      return `
        <div class="trend-col" title="${esc(k)}: ${pct}%">
          <div class="trend-bar ${isCurrent ? 'current' : ''}" style="height:${height}%"></div>
          <span class="trend-label">W${short}</span>
        </div>`
    })
    .join('')

  return `
    <section class="section panel">
      <h2>Progress · last 8 weeks</h2>
      <p class="panel-hint">Consistency % = completed hits / expected hits for that week’s protocol.</p>
      <div class="trend">${cols}</div>
    </section>
  `
}

// ── Modals ─────────────────────────────────────────────────────

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

function renderHabitModal(): string {
  if (!modal || modal.kind !== 'habit') return ''
  const editId = modal.habitId
  const isNew = editId === null
  const habit = isNew
    ? emptyHabitDraft()
    : (getHabit(editId) ?? emptyHabitDraft())
  const title = isNew ? 'New habit' : `Edit habit`
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
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="habit-modal-title" data-stop>
        <div class="modal-header">
          <h2 id="habit-modal-title">${title}</h2>
          <button type="button" class="icon ghost" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <form id="habit-form" class="modal-form">
          <input type="hidden" name="id" value="${esc(habit.id)}" />
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" value="${esc(habit.name)}" required maxlength="80" placeholder="e.g. Morning pages" />
          </label>
          <label class="field">
            <span>Description</span>
            <textarea name="description" rows="2" required maxlength="400" placeholder="What and why">${esc(habit.description)}</textarea>
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
            <input type="text" name="med" value="${esc(habit.med)}" maxlength="200" placeholder="Smallest useful version" />
          </label>
          <label class="field">
            <span>High-intensity version</span>
            <input type="text" name="highIntensity" value="${esc(habit.highIntensity)}" maxlength="200" placeholder="Full version" />
          </label>
          ${
            !isNew && isCoreHabit(habit.id)
              ? `<p class="form-note">Core habit — edits are saved as a local override (exportable).</p>`
              : ''
          }
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

function renderPackModal(weekKey: string): string {
  if (!modal || modal.kind !== 'pack') return ''
  const editId = modal.packId
  const isNew = editId === null
  const pack: Pack = isNew
    ? {
        id: '',
        name: '',
        description: '',
        habitIds: loadProtocol(weekKey).habitIds.slice(),
        custom: true,
      }
    : (getPack(editId) ?? {
        id: '',
        name: '',
        description: '',
        habitIds: [],
        custom: true,
      })

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
      <div class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="pack-modal-title" data-stop>
        <div class="modal-header">
          <h2 id="pack-modal-title">${isNew ? 'New custom pack' : 'Edit pack'}</h2>
          <button type="button" class="icon ghost" data-action="close-modal" aria-label="Close">✕</button>
        </div>
        <form id="pack-form" class="modal-form">
          <input type="hidden" name="id" value="${esc(pack.id)}" />
          <label class="field">
            <span>Name</span>
            <input type="text" name="name" value="${esc(pack.name)}" required maxlength="60" placeholder="e.g. Exam Week" />
          </label>
          <label class="field">
            <span>Description</span>
            <input type="text" name="description" value="${esc(pack.description)}" maxlength="200" placeholder="When to use this pack" />
          </label>
          ${
            isNew && pack.habitIds.length > 0
              ? `<p class="form-note">Pre-filled with this week’s protocol (${pack.habitIds.length} habits). Adjust below.</p>`
              : ''
          }
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

// ── App shell ──────────────────────────────────────────────────

export function renderApp(root: HTMLElement): void {
  const weekKey = getActiveWeek()
  const selected = protocolHabits(weekKey)
  const selectedIds = new Set(selected.map((h) => h.id))

  root.innerHTML = `
    ${renderHeader(weekKey)}
    <div class="top-grid">
      ${renderPacks()}
      ${renderRadarPanel(selected)}
      ${renderProtocol(weekKey, selected)}
    </div>
    ${renderLibrary(selectedIds)}
    ${renderProgress(weekKey)}
    ${renderHabitModal()}
    ${renderPackModal(weekKey)}
  `

  bindEvents(root, weekKey)
}

function readHabitForm(form: HTMLFormElement): Habit | null {
  const fd = new FormData(form)
  const name = String(fd.get('name') ?? '').trim()
  if (!name) return null
  let id = String(fd.get('id') ?? '').trim()
  const isNew = !id
  if (isNew) id = uniqueHabitId(name)

  const category = String(fd.get('category')) as Category
  if (!CATEGORIES.includes(category)) return null
  const frequency = String(fd.get('frequency')) as Frequency
  if (!FREQUENCIES.includes(frequency)) return null

  const existing = getHabit(id)
  return {
    id,
    name,
    description: String(fd.get('description') ?? '').trim(),
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

  root.querySelector('[data-action="week-prev"]')?.addEventListener('click', () => {
    setActiveWeek(shiftWeek(weekKey, -1))
    rerender()
  })
  root.querySelector('[data-action="week-next"]')?.addEventListener('click', () => {
    setActiveWeek(shiftWeek(weekKey, 1))
    rerender()
  })
  root.querySelector('[data-action="week-today"]')?.addEventListener('click', () => {
    setActiveWeek(isoWeekKey())
    rerender()
  })

  root.querySelector('[data-action="export"]')?.addEventListener('click', () => {
    downloadExport()
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
      importAll(blob)
      rerender()
    } catch (e) {
      alert(`Import failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      fileInput.value = ''
    }
  })

  // Modal open/close
  root.querySelectorAll('[data-action="close-modal"]').forEach((el) => {
    el.addEventListener('click', (ev) => {
      if (el.hasAttribute('data-stop') && ev.target !== el) return
      // backdrop: only close if click is on backdrop itself
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

  root.querySelector('[data-action="new-habit"]')?.addEventListener('click', () => {
    modal = { kind: 'habit', habitId: null }
    rerender()
  })
  root.querySelectorAll('[data-action="edit-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      modal = { kind: 'habit', habitId: id }
      rerender()
    })
  })
  root.querySelector('[data-action="new-pack"]')?.addEventListener('click', () => {
    modal = { kind: 'pack', packId: null }
    rerender()
  })
  root.querySelectorAll('[data-action="edit-pack"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.packId
      if (!id) return
      modal = { kind: 'pack', packId: id }
      rerender()
    })
  })

  root.querySelectorAll('[data-action="delete-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      if (!confirm('Delete this custom habit?')) return
      if (!deleteHabit(id)) {
        alert('Core habits cannot be deleted (you can still edit them).')
        return
      }
      modal = null
      rerender()
    })
  })

  root.querySelectorAll('[data-action="delete-pack"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.packId
      if (!id) return
      if (!confirm('Delete this custom pack?')) return
      if (!deletePack(id)) {
        alert('Built-in packs cannot be deleted.')
        return
      }
      modal = null
      rerender()
    })
  })

  const habitForm = root.querySelector<HTMLFormElement>('#habit-form')
  habitForm?.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const habit = readHabitForm(habitForm)
    if (!habit) {
      alert('Please fill required fields.')
      return
    }
    saveHabit(habit)
    modal = null
    rerender()
  })

  const packForm = root.querySelector<HTMLFormElement>('#pack-form')
  packForm?.addEventListener('submit', (ev) => {
    ev.preventDefault()
    const pack = readPackForm(packForm)
    if (!pack) {
      alert('Please name the pack.')
      return
    }
    if (pack.habitIds.length === 0) {
      alert('Select at least one habit for the pack.')
      return
    }
    savePack(pack)
    modal = null
    rerender()
  })

  root.querySelectorAll('[data-action="apply-pack"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.packId
      if (!id) return
      if (
        loadProtocol(weekKey).habitIds.length > 0 &&
        !confirm('Replace this week’s protocol with the pack?')
      ) {
        return
      }
      applyPack(weekKey, id)
      rerender()
    })
  })

  root.querySelectorAll('[data-action="toggle-habit"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      toggleHabit(weekKey, id)
      rerender()
    })
  })

  root.querySelectorAll('[data-action="remove"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      toggleHabit(weekKey, id)
      rerender()
    })
  })

  root.querySelectorAll('[data-action="inc"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      const progress = loadProgress(weekKey)
      const cur = progress.completions[id] ?? 0
      const habit = getHabit(id)
      const cap = habit ? weeklyTarget(habit) + 5 : cur + 1
      setCompletion(weekKey, id, Math.min(cur + 1, cap))
      rerender()
    })
  })

  root.querySelectorAll('[data-action="dec"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      const progress = loadProgress(weekKey)
      const cur = progress.completions[id] ?? 0
      setCompletion(weekKey, id, cur - 1)
      rerender()
    })
  })

  root.querySelectorAll('[data-action="filter"]').forEach((el) => {
    el.addEventListener('click', () => {
      const cat = (el as HTMLElement).dataset.category as Category | 'all'
      filterCategory = cat
      rerender()
    })
  })

  root.querySelectorAll('[data-action="toggle-details"]').forEach((el) => {
    el.addEventListener('click', () => {
      const id = (el as HTMLElement).dataset.habitId
      if (!id) return
      expandedId = expandedId === id ? null : id
      rerender()
    })
  })
}
