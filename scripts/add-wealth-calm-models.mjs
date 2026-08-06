/**
 * Packs + habits:
 * - Data-backed wealth building
 * - Mentally calm but sharp
 * - Building a large mental-model library (process habits, not 100 separate models)
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const habitsPath = join(root, 'data', 'habits.json')
const packsPath = join(root, 'data', 'packs.json')

const habits = JSON.parse(readFileSync(habitsPath, 'utf8'))
const packs = JSON.parse(readFileSync(packsPath, 'utf8'))
const have = new Set(habits.map((h) => h.id))
const packHave = new Set(packs.map((p) => p.id))

function H(p) {
  return {
    source: 'core',
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: '',
    highIntensity: '',
    secondaryTags: [],
    ...p,
  }
}

const newHabits = [
  // ── Wealth (evidence-aligned personal finance) ─────────────
  H({
    id: 'fin-net-worth-snapshot',
    name: 'Net-worth snapshot',
    description:
      'Why: Tracking net worth (assets − liabilities) is a simple, evidence-aligned way to see whether wealth is actually compounding—not just income vibes.',
    how: '1) Update balances: cash, investments, debts, major assets (rough is fine).\n2) Record net worth and date.\n3) Note one driver of change (saved, markets, debt paydown, spend).\n4) No daily obsessing—weekly or monthly cadence.',
    category: 'finance',
    secondaryTags: ['wealth', 'tracking'],
    difficulty: { time: 3, willpower: 2, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: '10-minute rough net-worth update',
    highIntensity: 'Full spreadsheet + debt interest review',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'fin-auto-invest-check',
    name: 'Auto-invest confirmation',
    description:
      'Why: Automated contributions to diversified investments beat timing the market for most people; checking the pipe runs prevents silent failure.',
    how: '1) Confirm scheduled transfers to investment/retirement accounts executed.\n2) If cash piled up, increase automation or invest the surplus per your rule.\n3) Prefer broad low-cost funds unless you have a written reason otherwise.\n4) Log “ran / fixed.”',
    category: 'finance',
    secondaryTags: ['wealth', 'investing'],
    difficulty: { time: 2, willpower: 2, energy: 2 },
    effect: { shortTerm: 3, longTerm: 9, identity: 6 },
    med: 'Confirm automations ran',
    highIntensity: 'Raise contribution rate or fix a broken auto-invest',
    frequency: 'weekly',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'fin-savings-rate',
    name: 'Savings-rate check',
    description:
      'Why: Savings rate (saved ÷ income) strongly predicts wealth building more than stock-picking skill for typical households.',
    how: '1) Estimate this month’s income and amount saved/invested.\n2) Compute rough savings rate.\n3) If below your target, cut one spend or raise income action.\n4) Write the target rate somewhere visible.',
    category: 'finance',
    secondaryTags: ['wealth'],
    difficulty: { time: 3, willpower: 3, energy: 2 },
    effect: { shortTerm: 4, longTerm: 9, identity: 7 },
    med: 'Quick % estimate + one note',
    highIntensity: 'Full month calc + plan to lift rate 1–2 points',
    frequency: 'weekly',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'fin-high-interest-debt',
    name: 'High-interest debt attack',
    description:
      'Why: Paying down high-APR debt is often a guaranteed high “return”; evidence favors prioritizing costly consumer debt.',
    how: '1) List debts with APRs.\n2) Extra payment to highest APR (or snowball if adherence needs wins).\n3) Avoid new high-interest balances.\n4) Log payment made.',
    category: 'finance',
    secondaryTags: ['wealth', 'debt'],
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 9, identity: 6 },
    med: 'Minimum + small extra to highest APR',
    highIntensity: 'Aggressive extra payment + cut the spending source',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'fin-runway-weeks',
    name: 'Cash runway check',
    description:
      'Why: Emergency liquidity reduces forced selling and panic; runway in months/weeks of essential expenses is a standard resilience metric.',
    how: '1) Essential monthly burn estimate.\n2) Liquid cash ÷ burn = runway.\n3) If thin, route surplus to cash before aggressive risk.\n4) Target a runway band you pre-chose (e.g. 3–6 months).',
    category: 'finance',
    secondaryTags: ['wealth', 'safety'],
    difficulty: { time: 2, willpower: 2, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 5 },
    med: 'Recalculate runway in 5 minutes',
    highIntensity: 'Rebuild runway plan with automatic transfers',
    frequency: 'weekly',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'fin-lifestyle-creep',
    name: 'Lifestyle-creep intercept',
    description:
      'Why: Income rises often get eaten by lifestyle; intercepting upgrades preserves savings rate—the main wealth lever.',
    how: '1) Notice one recent or tempting upgrade (housing, car, subscription, dining).\n2) Ask: does this raise long-term options or only status?\n3) Delay 72 hours or set a cheaper default.\n4) Route the difference to invest/debt.',
    category: 'finance',
    secondaryTags: ['wealth', 'spending'],
    difficulty: { time: 2, willpower: 6, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 7 },
    med: 'One deliberate non-upgrade or delay',
    highIntensity: 'Cancel/renegotiate a lifestyle line item',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'fin-income-skill-hour',
    name: 'Income-skill deliberate hour',
    description:
      'Why: Human capital and scarce skills drive lifetime earnings more than frugality alone; invest hours in monetizable skill.',
    how: '1) Pick one skill with market demand (craft, sales, systems, credential).\n2) 45–90 minutes deliberate practice or portfolio proof.\n3) Ship a visible artifact when possible.\n4) Track hours monthly.',
    category: 'finance',
    secondaryTags: ['wealth', 'career', 'skill'],
    difficulty: { time: 6, willpower: 5, energy: 6 },
    effect: { shortTerm: 4, longTerm: 9, identity: 8 },
    med: '45 minutes skill practice',
    highIntensity: '90 minutes + shipped proof',
    frequency: 'several_per_week',
    timeEstimateMinutes: 60,
  }),
  H({
    id: 'fin-negotiate-prep',
    name: 'Compensation negotiation prep',
    description:
      'Why: Negotiation and market data move total compensation; small percentage gains compound across a career.',
    how: '1) Gather 1–2 market data points for your role.\n2) Write your value bullets and ask range.\n3) Practice the script once aloud.\n4) Schedule or take one real step (doc, chat, application).',
    category: 'finance',
    secondaryTags: ['wealth', 'career'],
    difficulty: { time: 4, willpower: 6, energy: 4 },
    effect: { shortTerm: 3, longTerm: 9, identity: 7 },
    med: '15 minutes market note + script',
    highIntensity: 'Full prep + send the ask or book the meeting',
    frequency: 'weekly',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'fin-tax-advantaged-check',
    name: 'Tax-advantaged account check',
    description:
      'Why: Using tax-advantaged accounts (when available) improves after-tax compounding—standard evidence-based advice.',
    how: '1) Confirm contribution room / employer match status.\n2) Capture match first if offered.\n3) Increase auto % if under-using room and cashflow allows.\n4) One note: “match free money: yes/no.”',
    category: 'finance',
    secondaryTags: ['wealth', 'tax'],
    difficulty: { time: 3, willpower: 3, energy: 2 },
    effect: { shortTerm: 3, longTerm: 9, identity: 5 },
    med: 'Confirm match + contribution status',
    highIntensity: 'Increase contribution or open missing account',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'fin-avoid-timing-games',
    name: 'No market-timing decision',
    description:
      'Why: For most investors, time in market beats timing; a weekly habit to refuse impulsive trades protects long-run returns.',
    how: '1) Notice urge to trade on news/fear/greed.\n2) Default: do nothing; stick to IPS/auto plan.\n3) If changing strategy, wait 48 hours and write reasons.\n4) Log “no impulsive trade.”',
    category: 'finance',
    secondaryTags: ['wealth', 'investing'],
    difficulty: { time: 1, willpower: 5, energy: 2 },
    effect: { shortTerm: 3, longTerm: 8, identity: 6 },
    med: 'Refuse one impulsive finance check/trade',
    highIntensity: 'Full week of schedule-only portfolio actions',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),
  H({
    id: 'fin-unit-economics-personal',
    name: 'Personal unit economics',
    description:
      'Why: Knowing cost per useful unit (commute meal, subscription hour of joy, side-project hourly) improves decisions like a simple business case.',
    how: '1) Pick one recurring spend.\n2) Estimate cost per use or per hour of value.\n3) Keep, cut, or renegotiate based on the number.\n4) Write the unit cost down.',
    category: 'finance',
    secondaryTags: ['wealth', 'spending'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'One spend unit-cost calc',
    highIntensity: 'Three categories + one cut',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'fin-learn-one-money-concept',
    name: 'Learn one money concept',
    description:
      'Why: Financial literacy compounds decisions; short, accurate learning (index funds, fees, inflation, risk) beats hot tips.',
    how: '1) Pick one concept (fees, inflation, diversification, tax basics).\n2) Read/watch a high-quality source 15–25 minutes.\n3) Write a 5-sentence explanation in your words.\n4) Note one behavior change if any.',
    category: 'finance',
    secondaryTags: ['wealth', 'learning'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: '15 minutes + 3 sentences',
    highIntensity: '25 minutes + teach-back paragraph',
    frequency: 'weekly',
    timeEstimateMinutes: 20,
  }),

  // ── Calm but sharp ─────────────────────────────────────────
  H({
    id: 'calm-single-task',
    name: 'Single-task sprint',
    description:
      'Why: Multitasking taxes working memory and raises subjective stress while lowering quality; single-task sprints keep calm focus.',
    how: '1) One task only for 25–50 minutes.\n2) Notifications off; one window.\n3) If interrupted, park the interrupt on paper.\n4) Short break after—no feed spiral.',
    category: 'intelligence',
    secondaryTags: ['calm', 'focus'],
    difficulty: { time: 4, willpower: 6, energy: 5 },
    effect: { shortTerm: 6, longTerm: 7, identity: 6 },
    med: '25-minute single-task',
    highIntensity: '50-minute single-task + shutdown note',
    frequency: 'daily',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'calm-worry-dump',
    name: 'Worry dump then close',
    description:
      'Why: Externalizing worries reduces rumination loops; closing the list returns attention to the present task—calm with readiness.',
    how: '1) Set 5–10 minutes.\n2) Write every open loop/worry uncensored.\n3) Star only items actionable today; schedule or trash the rest.\n4) Physically close the note and start one action or one breath set.',
    category: 'intelligence',
    secondaryTags: ['calm', 'stress'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 6, longTerm: 6, identity: 5 },
    med: '5-minute dump + close',
    highIntensity: '10-minute dump + schedule all stars',
    frequency: 'daily',
    timeEstimateMinutes: 8,
  }),
  H({
    id: 'calm-alert-body',
    name: 'Alert-calm body reset',
    description:
      'Why: Soft eyes, longer exhales, and relaxed jaw/shoulders lower arousal without sleepiness—body state for sharp work under pressure.',
    how: '1) Drop shoulders; unclench jaw.\n2) Soften gaze (wider peripheral).\n3) 5 long exhales.\n4) Return to task with one clear next action.',
    category: 'health',
    secondaryTags: ['calm', 'breath'],
    difficulty: { time: 1, willpower: 2, energy: 1 },
    effect: { shortTerm: 6, longTerm: 5, identity: 4 },
    med: '60-second reset',
    highIntensity: '3-minute reset mid-stress',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),
  H({
    id: 'calm-info-diet',
    name: 'Info-diet window',
    description:
      'Why: Constant news/feeds raise anxiety and fragment attention; a bounded info window keeps you informed without ambient stress.',
    how: '1) Pick one or two windows/day for news/social.\n2) Outside windows: no feeds.\n3) Prefer written summaries over rage video.\n4) End window on a timer.',
    category: 'intelligence',
    secondaryTags: ['calm', 'focus'],
    difficulty: { time: 1, willpower: 7, energy: 2 },
    effect: { shortTerm: 5, longTerm: 7, identity: 7 },
    med: 'One timed 15-minute info window only',
    highIntensity: 'Zero feeds outside a single 20-minute slot',
    frequency: 'daily',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'calm-premortem-calm',
    name: 'Calm premortem',
    description:
      'Why: Premortems reduce anxiety from ambiguity by converting vague dread into specific risks and mitigations—sharp planning without panic.',
    how: '1) Name the upcoming decision/event.\n2) “It’s 3 months later and it failed—why?” list 5 reasons.\n3) Add one mitigation each.\n4) Stop at timebox; act on top mitigation only.',
    category: 'career',
    secondaryTags: ['calm', 'decision'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 6 },
    med: '5-minute premortem',
    highIntensity: '15-minute premortem + calendar mitigations',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'calm-caffeine-for-focus',
    name: 'Caffeine only with a focus plan',
    description:
      'Why: Caffeine amplifies arousal—pair with a written focus target so it sharpens work instead of sharpening anxiety and tab-hopping.',
    how: '1) Before caffeine, write the one outcome for the next block.\n2) Consume caffeine.\n3) Start the block within 10 minutes.\n4) No caffeine as boredom entertainment.',
    category: 'intelligence',
    secondaryTags: ['calm', 'focus'],
    difficulty: { time: 1, willpower: 4, energy: 2 },
    effect: { shortTerm: 5, longTerm: 6, identity: 5 },
    med: 'One planned caffeine + focus pairing',
    highIntensity: 'All caffeine doses paired with written outcomes',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),

  // ── Mental models (build toward a large library) ───────────
  H({
    id: 'mm-capture-one',
    name: 'Capture one mental model',
    description:
      'Why: Building toward ~100 models starts with deliberate capture—name, definition, domain—so models become reusable tools, not vibes.',
    how: '1) Encounter or recall one model (e.g. opportunity cost, inversion, base rates).\n2) Write: name, 2–3 sentence definition, one example.\n3) Tag domain (biz, mind, systems, people).\n4) Store in a single running list/deck.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'learning'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 9, identity: 7 },
    med: 'One model card (definition + example)',
    highIntensity: 'One model + two contrasting examples',
    frequency: 'daily',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'mm-apply-decision',
    name: 'Apply a model to a real decision',
    description:
      'Why: Models only pay rent when applied; force one model onto a live decision to train transfer.',
    how: '1) Pick a real decision today.\n2) Choose one model from your list.\n3) Write how the model changes the analysis or choice.\n4) Decide or note the open question.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 3, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 9, identity: 7 },
    med: 'One paragraph application',
    highIntensity: 'Two models applied to same decision + pick',
    frequency: 'daily',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'mm-inversion',
    name: 'Inversion pass',
    description:
      'Why: Inversion (“what would guarantee failure?”) is a core Munger-style model that surfaces risks and stupidity avoidance.',
    how: '1) State the goal.\n2) List ways to fail guaranteed.\n3) Avoid those paths explicitly.\n4) Convert top failures into checklists.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 2, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: '5-minute inversion on one goal',
    highIntensity: 'Full inversion + anti-goals written',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'mm-second-order',
    name: 'Second-order consequences',
    description:
      'Why: First-order thinking is common; second-order (“and then what?”) is a foundational model for strategy and personal choices.',
    how: '1) State the action.\n2) Write first-order effects.\n3) For each, write second-order effects (and then…).\n4) Adjust action if second-order is ugly.',
    category: 'intelligence',
    secondaryTags: ['mental-models'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'One action, two levels deep',
    highIntensity: 'Map three branches two levels deep',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'mm-base-rates',
    name: 'Base-rate before story',
    description:
      'Why: Outside view / base rates beat narrative bias; check reference classes before vivid stories decide for you.',
    how: '1) Frame the prediction or bet.\n2) Ask: what’s the base rate for similar cases?\n3) Only then weigh the unique story.\n4) Write both numbers/story and the adjusted view.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'One decision with explicit base-rate note',
    highIntensity: 'Base rate + comparison class research 20 min',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'mm-opportunity-cost',
    name: 'Name the opportunity cost',
    description:
      'Why: Every yes is a no to something else; naming opportunity cost is a high-ROI model for time and money.',
    how: '1) State the commitment (time/money).\n2) Write the next-best alternative sacrificed.\n3) Keep only if still worth it.\n4) Optional: estimate hours or dollars of the alternative.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'wealth'],
    difficulty: { time: 2, willpower: 4, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'One yes with named opportunity cost',
    highIntensity: 'Audit three commitments with opportunity costs',
    frequency: 'daily',
    timeEstimateMinutes: 8,
  }),
  H({
    id: 'mm-feynman-model',
    name: 'Feynman a model',
    description:
      'Why: If you can’t explain a model simply, you don’t own it; Feynman technique builds a real latticework, not name-dropping.',
    how: '1) Pick one model from your list.\n2) Explain it in plain language without jargon.\n3) Mark gaps; re-study only gaps.\n4) Add a sharper example.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'learning'],
    difficulty: { time: 3, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 9, identity: 7 },
    med: '5-minute plain explanation',
    highIntensity: 'Teach-back + diagram',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'mm-spaced-models-review',
    name: 'Spaced review of model deck',
    description:
      'Why: A path to ~100 models requires spaced review or the latticework decays into trivia.',
    how: '1) Open your model list/deck.\n2) Review 5–15 models: define + example from memory.\n3) Fail → rewrite card.\n4) Prefer weak cards.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'memory'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 3, longTerm: 9, identity: 6 },
    med: '5 models from memory',
    highIntensity: '15 models + rewrite weak cards',
    frequency: 'daily',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'mm-cross-domain-transfer',
    name: 'Cross-domain model transfer',
    description:
      'Why: Latticework means borrowing models across domains (biology→business, physics→product); transfer is the advanced skill.',
    how: '1) Pick a model from domain A.\n2) Force-apply to a problem in domain B (work, health, relationships).\n3) Write what transfers and what breaks.\n4) Keep the valid mapping in your deck.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'advanced'],
    difficulty: { time: 4, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 9, identity: 7 },
    med: 'One cross-domain mapping paragraph',
    highIntensity: 'Two mappings + present one to someone',
    frequency: 'several_per_week',
    timeEstimateMinutes: 20,
  }),
  H({
    id: 'mm-kill-update-model',
    name: 'Kill or update a bad model',
    description:
      'Why: Wrong models are worse than none; Bayesian updating / killing pet theories keeps the lattice honest.',
    how: '1) Find a belief/model you use that failed recently.\n2) Write disconfirming evidence.\n3) Revise or retire it explicitly.\n4) Note the replacement rule.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'advanced'],
    difficulty: { time: 3, willpower: 6, energy: 4 },
    effect: { shortTerm: 4, longTerm: 9, identity: 8 },
    med: 'One model marked revised/retired',
    highIntensity: 'Full postmortem + new decision rule',
    frequency: 'weekly',
    timeEstimateMinutes: 20,
  }),
  H({
    id: 'mm-read-model-source',
    name: 'Read from a model source',
    description:
      'Why: Quality inputs (clear thinkers, model catalogs, case studies) feed the path to a large, accurate set of mental models.',
    how: '1) Read 15–30 minutes from a high-signal source on reasoning/models/cases.\n2) Extract one model or sharpen an existing one.\n3) Capture to your deck.\n4) Avoid hot-take threads as primary source.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'learning'],
    difficulty: { time: 4, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: '15 minutes + one capture',
    highIntensity: '30 minutes + two captures',
    frequency: 'several_per_week',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'mm-circle-of-competence',
    name: 'Circle of competence check',
    description:
      'Why: Knowing the edge of what you understand prevents overconfident bets—classic model for career and investing.',
    how: '1) For a live opinion or bet, draw: core competence / edge / outside.\n2) Mark where this decision sits.\n3) If outside, get help, shrink size, or learn first.\n4) Write one humility constraint.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 2, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 7 },
    med: 'One decision tagged in/out of circle',
    highIntensity: 'Map three active projects to the circle',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
]

let addedH = 0
for (const h of newHabits) {
  if (have.has(h.id)) continue
  habits.push(h)
  have.add(h.id)
  addedH++
}

const newPacks = [
  {
    id: 'wealth-data-basic',
    name: 'Wealth · Data-backed basics',
    description:
      'Evidence-aligned money core: measure net worth, automate investing, savings rate, surplus rule, spend audit, no timing games. Merge then prune.',
    habitIds: [
      'fin-net-worth-snapshot',
      'fin-auto-invest-check',
      'fin-savings-rate',
      'fin-surplus-rule',
      'fin-spend-audit-slice',
      'fin-avoid-timing-games',
    ],
  },
  {
    id: 'wealth-data-advanced',
    name: 'Wealth · Income & defense',
    description:
      'Raise human capital and protect downside: income skill, negotiate prep, tax-advantaged check, high-interest debt, runway, lifestyle creep.',
    habitIds: [
      'fin-income-skill-hour',
      'fin-negotiate-prep',
      'fin-tax-advantaged-check',
      'fin-high-interest-debt',
      'fin-runway-weeks',
      'fin-lifestyle-creep',
    ],
  },
  {
    id: 'wealth-data-decisions',
    name: 'Wealth · Sharp money decisions',
    description:
      'Decision hygiene for money: weekly review, unit economics, learn a concept, compensation hygiene, admin batch, opportunity cost.',
    habitIds: [
      'fin-weekly-money-review',
      'fin-unit-economics-personal',
      'fin-learn-one-money-concept',
      'fin-compensation-hygiene',
      'fin-admin-batch',
      'mm-opportunity-cost',
    ],
  },
  {
    id: 'calm-sharp',
    name: 'Calm but sharp',
    description:
      'Low anxiety, high focus: single-task, worry dump, alert-calm body, info diet, physiological sigh, visual focus spotlight.',
    habitIds: [
      'calm-single-task',
      'calm-worry-dump',
      'calm-alert-body',
      'calm-info-diet',
      'hub-physiological-sigh',
      'hub-visual-focus-spotlight',
    ],
  },
  {
    id: 'calm-sharp-deep',
    name: 'Calm but sharp · Deep work',
    description:
      'Sustained calm performance: deep work, long exhale, phone-free morning, caffeine-with-plan, premortem, NSDR.',
    habitIds: [
      'intel-deep-work',
      'hub-long-exhale',
      'hub-phone-morning',
      'calm-caffeine-for-focus',
      'calm-premortem-calm',
      'hub-nsdr',
    ],
  },
  {
    id: 'mental-models-basic',
    name: 'Mental models · Build the lattice',
    description:
      'Path to ~100 models: capture daily, apply to decisions, spaced review, Feynman, read sources, opportunity cost. Count cards—not vibes.',
    habitIds: [
      'mm-capture-one',
      'mm-apply-decision',
      'mm-spaced-models-review',
      'mm-feynman-model',
      'mm-read-model-source',
      'mm-opportunity-cost',
    ],
  },
  {
    id: 'mental-models-core-tools',
    name: 'Mental models · Core tools',
    description:
      'High-frequency reasoning tools: inversion, second-order, base rates, circle of competence, hypothesis-validate, write-to-clarify.',
    habitIds: [
      'mm-inversion',
      'mm-second-order',
      'mm-base-rates',
      'mm-circle-of-competence',
      'intel-hypothesis-validate',
      'intel-write-to-clarify',
    ],
  },
  {
    id: 'mental-models-advanced',
    name: 'Mental models · Advanced lattice',
    description:
      'Transfer and integrity: cross-domain mapping, kill/update bad models, teach-back, categorize learning, retrieval, deliberate practice.',
    habitIds: [
      'mm-cross-domain-transfer',
      'mm-kill-update-model',
      'hub-teach-back',
      'intel-categorize-daily-learning',
      'hub-retrieval-practice',
      'intel-deliberate-practice',
    ],
  },
]

let addedP = 0
for (const p of newPacks) {
  const missing = p.habitIds.filter((id) => !have.has(id))
  if (missing.length) {
    console.error('MISSING', p.id, missing)
    process.exit(1)
  }
  if (p.habitIds.length !== 6) {
    console.error('NOT 6', p.id, p.habitIds.length)
    process.exit(1)
  }
  const idx = packs.findIndex((x) => x.id === p.id)
  if (idx >= 0) packs[idx] = p
  else {
    packs.push(p)
    addedP++
  }
}

writeFileSync(habitsPath, JSON.stringify(habits, null, 2) + '\n')
writeFileSync(packsPath, JSON.stringify(packs, null, 2) + '\n')
console.log(
  `habits ${habits.length} (+${addedH}); packs ${packs.length} (+${addedP})`,
)
