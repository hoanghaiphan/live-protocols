import type { Category } from './types'
import { CATEGORY_COLORS, CATEGORY_LABELS } from './types'
import type { CategoryScores } from './scoring'
import { RADAR_MAX } from './scoring'

/** Clockwise from top */
const AXIS_ORDER: Category[] = [
  'health',
  'intelligence',
  'social',
  'finance',
  'career',
  'creativity',
]

function polar(
  cx: number,
  cy: number,
  r: number,
  angleIndex: number,
): [number, number] {
  const angle = -Math.PI / 2 + angleIndex * ((2 * Math.PI) / 6)
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

function ringPoints(cx: number, cy: number, r: number): string {
  return AXIS_ORDER.map((_, i) => polar(cx, cy, r, i).join(',')).join(' ')
}

function scorePolygon(
  cx: number,
  cy: number,
  maxR: number,
  scores: CategoryScores,
  maxScore: number,
): string {
  return AXIS_ORDER.map((cat, i) => {
    const s = Math.max(0, Math.min(maxScore, scores[cat] ?? 0))
    const r = (s / maxScore) * maxR
    return polar(cx, cy, r, i).join(',')
  }).join(' ')
}

export interface RadarRenderOptions {
  scores: CategoryScores
  width?: number
  height?: number
  /** Ideal reference ring as fraction of max (0–1). */
  idealFraction?: number
}

export function renderRadarSvg(opts: RadarRenderOptions): string {
  const width = opts.width ?? 320
  const height = opts.height ?? 300
  const maxScore = RADAR_MAX
  const cx = width / 2
  const cy = height / 2 + 4
  const maxR = Math.min(width, height) * 0.36
  const rings = [0.25, 0.5, 0.75, 1]

  const guide = rings
    .map(
      (f) =>
        `<polygon points="${ringPoints(cx, cy, maxR * f)}" class="radar-ring" />`,
    )
    .join('')

  const spokes = AXIS_ORDER.map((cat, i) => {
    const [x, y] = polar(cx, cy, maxR, i)
    const color = CATEGORY_COLORS[cat]
    return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" class="radar-spoke" stroke="${color}" stroke-opacity="0.35" />`
  }).join('')

  const idealFrac = opts.idealFraction ?? 0.7
  const ideal = `<polygon points="${ringPoints(cx, cy, maxR * idealFrac)}" class="radar-ideal" />`

  const data = `<polygon points="${scorePolygon(cx, cy, maxR, opts.scores, maxScore)}" class="radar-fill" />`

  const vertices = AXIS_ORDER.map((cat, i) => {
    const s = Math.max(0, Math.min(maxScore, opts.scores[cat] ?? 0))
    const r = (s / maxScore) * maxR
    const [x, y] = polar(cx, cy, r, i)
    const color = CATEGORY_COLORS[cat]
    return `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}" stroke="var(--bg-elev, #171b22)" stroke-width="1.5" />`
  }).join('')

  const labels = AXIS_ORDER.map((cat, i) => {
    const [x, y] = polar(cx, cy, maxR + 22, i)
    const short =
      cat === 'social'
        ? 'Social'
        : cat === 'creativity'
          ? 'Creativity'
          : CATEGORY_LABELS[cat]
    const score = (opts.scores[cat] ?? 0).toFixed(1)
    const color = CATEGORY_COLORS[cat]
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" class="radar-label" fill="${color}">${short}
      <tspan class="radar-label-score" x="${x}" dy="1.1em" fill="${color}" fill-opacity="0.75">${score}/${maxScore}</tspan>
    </text>`
  }).join('')

  return `<svg viewBox="0 0 ${width} ${height}" class="radar-svg" role="img" aria-label="Category balance radar">
    ${guide}
    ${spokes}
    ${ideal}
    ${data}
    ${vertices}
    ${labels}
  </svg>`
}
