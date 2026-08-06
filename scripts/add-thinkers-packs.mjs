/**
 * - Remove mental-models-basic pack + its exclusive habits
 * - Add Core-tools-style MM packs
 * - Thinking Fast and Slow packs
 * - Elon / Jobs / Paul Graham packs
 * - Packs distilled from Life Protocols / Grok chat themes
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const habitsPath = join(root, 'data', 'habits.json')
const packsPath = join(root, 'data', 'packs.json')

let habits = JSON.parse(readFileSync(habitsPath, 'utf8'))
let packs = JSON.parse(readFileSync(packsPath, 'utf8'))

// ── 1. Remove lattice pack + exclusive habits ─────────────────
const REMOVE_PACK = 'mental-models-basic'
const REMOVE_HABITS = new Set([
  'mm-capture-one',
  'mm-apply-decision',
  'mm-spaced-models-review',
  'mm-feynman-model',
  'mm-read-model-source',
  // keep mm-opportunity-cost (used by wealth-data-decisions)
])

packs = packs.filter((p) => p.id !== REMOVE_PACK)
habits = habits.filter((h) => !REMOVE_HABITS.has(h.id))

// Strip removed ids from any remaining packs (safety)
for (const p of packs) {
  p.habitIds = p.habitIds.filter((id) => !REMOVE_HABITS.has(id))
}

const have = new Set(habits.map((h) => h.id))

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
  // ── More core-tool mental models ───────────────────────────
  H({
    id: 'mm-incentives',
    name: 'Map the incentives',
    description:
      'Why: “Show me the incentive and I will show you the outcome.” Incentive maps prevent naive plans about people and systems.',
    how: '1) Name the actors in a situation.\n2) For each, write what they are paid/rewarded/punished for.\n3) Predict behavior from incentives, not hopes.\n4) Redesign your ask or system if incentives fight the goal.',
    category: 'intelligence',
    secondaryTags: ['mental-models'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Map incentives for one conflict',
    highIntensity: 'Full actor-incentive table + redesigned ask',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'mm-margin-of-safety',
    name: 'Margin of safety',
    description:
      'Why: Engineering and investing both use buffers; plans without margin fail under normal variance.',
    how: '1) State the plan’s tight assumption (time, money, capacity).\n2) Add an explicit buffer (time, cash, redundancy).\n3) Prefer downside-protected options when uncertainty is high.\n4) Write the buffer number down.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Add one buffer to today’s plan',
    highIntensity: 'Rebuild a plan with explicit safety margins',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'mm-feedback-loops',
    name: 'Find the feedback loop',
    description:
      'Why: Systems run on reinforcing and balancing loops; spotting them explains growth spirals and stuck states.',
    how: '1) Pick a stuck or runaway situation.\n2) Sketch what amplifies it vs what dampens it.\n3) Intervene on the loop, not only the symptom.\n4) One sentence: “The loop is…”',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'systems'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Name one reinforcing or balancing loop',
    highIntensity: 'Diagram + one loop intervention',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'mm-map-territory',
    name: 'Map ≠ territory check',
    description:
      'Why: Models and dashboards are not reality; treating the map as the territory creates blind spots.',
    how: '1) Notice a metric, label, or plan you treat as truth.\n2) Ask what it leaves out.\n3) Get one ground-truth contact (user, data, observation).\n4) Update the map or discount it.',
    category: 'intelligence',
    secondaryTags: ['mental-models'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 7, identity: 6 },
    med: 'One metric challenged with reality',
    highIntensity: 'Field check + revised model',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'mm-sunk-cost',
    name: 'Ignore sunk costs',
    description:
      'Why: Past spend is gone; good decisions use forward costs and benefits only.',
    how: '1) Name a commitment you’re keeping “because we already invested.”\n2) Rewrite the choice with zero past cost.\n3) Continue only if future value > future cost.\n4) Kill or pivot without guilt theater.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 2, willpower: 6, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: 'One sunk-cost rewrite',
    highIntensity: 'Kill or formally continue with forward-only case',
    frequency: 'weekly',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'mm-pareto',
    name: 'Pareto / vital few',
    description:
      'Why: A minority of causes often drives most results; hunting the vital few beats uniform effort.',
    how: '1) List inputs and outcomes for a domain.\n2) Guess the 20% of causes driving ~80% of results.\n3) Double down on vital few; cut or defer the trivial many.\n4) One action on a vital lever today.',
    category: 'intelligence',
    secondaryTags: ['mental-models'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: 'Name vital few for one project',
    highIntensity: 'Reorder week around vital levers only',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'mm-probabilistic',
    name: 'Probabilistic forecast',
    description:
      'Why: Point predictions hide uncertainty; assigning rough probabilities improves calibration and decisions under risk.',
    how: '1) State a claim about the near future.\n2) Give a probability (e.g. 30/50/70), not “maybe.”\n3) Note what would move you ±20 points.\n4) Later, score calibration when outcome is known.',
    category: 'intelligence',
    secondaryTags: ['mental-models', 'decision'],
    difficulty: { time: 2, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: 'One probabilistic claim written',
    highIntensity: 'Three claims + calibration log',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'mm-bottleneck',
    name: 'Find the bottleneck',
    description:
      'Why: Throughput is set by the constraint; optimizing non-bottlenecks wastes energy.',
    how: '1) Name the flow (work, health, money).\n2) Locate the step that limits overall rate.\n3) Improve only that constraint this session.\n4) Re-check after the change.',
    category: 'career',
    secondaryTags: ['mental-models', 'execution'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 6, longTerm: 8, identity: 6 },
    med: 'Identify one bottleneck + one fix attempt',
    highIntensity: 'Half-day attack on the true constraint',
    frequency: 'several_per_week',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'mm-skin-in-game',
    name: 'Skin in the game check',
    description:
      'Why: Advice and plans without downside for the speaker are suspect; align risk with decision rights.',
    how: '1) For advice you follow or give, ask who pays if wrong.\n2) Prefer sources/options with shared downside.\n3) When deciding for others, note your exposure.\n4) Adjust trust weights accordingly.',
    category: 'intelligence',
    secondaryTags: ['mental-models'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 6 },
    med: 'One advice source scored for skin-in-game',
    highIntensity: 'Reweight three advisors/plans by exposure',
    frequency: 'weekly',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'mm-local-vs-global',
    name: 'Local optimum escape',
    description:
      'Why: Local maxima feel like progress while global goals stall; occasionally zoom out and reset the search.',
    how: '1) Name a metric you’ve been optimizing hard.\n2) Ask if it serves the larger goal.\n3) If stuck, try a discontinuous option (different approach, not more of same).\n4) One experiment off the local hill.',
    category: 'intelligence',
    secondaryTags: ['mental-models'],
    difficulty: { time: 3, willpower: 5, energy: 4 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: 'One local-vs-global note',
    highIntensity: 'Launch a discontinuous experiment',
    frequency: 'weekly',
    timeEstimateMinutes: 20,
  }),
  H({
    id: 'mm-asymmetric-bets',
    name: 'Asymmetric upside scan',
    description:
      'Why: Good strategies hunt asymmetric bets—limited downside, large upside—rather than symmetric grind only.',
    how: '1) List options with capped downside.\n2) Estimate upside if right.\n3) Take or enlarge asymmetric shots; shrink symmetric grind where possible.\n4) One small asymmetric action this week.',
    category: 'career',
    secondaryTags: ['mental-models', 'career'],
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: 'Identify one asymmetric option',
    highIntensity: 'Ship one low-downside high-upside action',
    frequency: 'weekly',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'mm-via-negativa',
    name: 'Via negativa (subtract first)',
    description:
      'Why: Improvement often comes from removing harm (meetings, deps, habits) faster than adding systems.',
    how: '1) List what to stop doing this week.\n2) Remove one process, commitment, or tool.\n3) Prefer delete over add when stuck.\n4) Note the freed time/energy.',
    category: 'career',
    secondaryTags: ['mental-models', 'elon-method'],
    difficulty: { time: 2, willpower: 5, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: 'Delete one low-value thing',
    highIntensity: 'Kill three commitments/processes',
    frequency: 'weekly',
    timeEstimateMinutes: 20,
  }),

  // ── Thinking Fast and Slow ─────────────────────────────────
  H({
    id: 'tfs-system2-slowdown',
    name: 'System-2 slowdown',
    description:
      'Why: Kahneman: hard, statistical, or moral judgments need slow System 2; rushing invites bias.',
    how: '1) Flag decisions that are important or statistical.\n2) Enforce a pause (minutes to sleep-on-it).\n3) Do explicit calculation or checklist—not vibe only.\n4) Write the System-2 reason.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'decision'],
    difficulty: { time: 3, willpower: 5, energy: 4 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: 'One forced pause before a hard call',
    highIntensity: 'Full checklist + overnight on a major decision',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'tfs-wysiati',
    name: 'WYSIATI check',
    description:
      'Why: “What you see is all there is”—System 1 builds coherent stories from incomplete data. Actively seek missing info.',
    how: '1) Notice a confident story you just formed.\n2) Ask: what haven’t I seen?\n3) List 3 missing data types.\n4) Gather one missing piece before locking the story.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'bias'],
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Name three missing-info types',
    highIntensity: 'Gather one missing source before deciding',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'tfs-anchoring-reset',
    name: 'Anchoring reset',
    description:
      'Why: First numbers warp estimates; Kahneman’s anchoring bias is everywhere in money, plans, and negotiations.',
    how: '1) Before seeing others’ numbers, write your independent estimate.\n2) After anchors appear, consciously re-estimate from zero base.\n3) Use ranges, not single points.\n4) In negotiation, set your anchor from research not theirs.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'bias'],
    difficulty: { time: 2, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: 'Independent estimate before anchors',
    highIntensity: 'Full re-estimate after discarding anchors',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'tfs-availability-audit',
    name: 'Availability bias audit',
    description:
      'Why: Vivid recent examples dominate risk perception; availability misprices rare vs common threats.',
    how: '1) Notice a fear or priority driven by a vivid story/news.\n2) Ask for base rates or boring statistics.\n3) Re-rank risks by frequency/impact not drama.\n4) One action based on rates not headlines.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'bias'],
    difficulty: { time: 2, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'One vivid fear checked against base rates',
    highIntensity: 'Risk list re-ranked by base rates',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'tfs-planning-fallacy',
    name: 'Planning-fallacy buffer',
    description:
      'Why: Inside view underestimates time/cost; use outside view and multiply estimates (planning fallacy).',
    how: '1) Make your naive time estimate.\n2) Recall similar past tasks’ actual duration.\n3) Multiply or add a buffer (e.g. ×1.5–2).\n4) Plan from the buffered number.',
    category: 'career',
    secondaryTags: ['kahneman', 'planning'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'One estimate with outside-view buffer',
    highIntensity: 'Re-plan a project with reference-class times',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'tfs-overconfidence-calibrate',
    name: 'Overconfidence calibration',
    description:
      'Why: People are typically overconfident; explicit confidence ratings and postmortems improve judgment.',
    how: '1) Make a prediction with a confidence %.\n2) Later record outcome.\n3) Track if you’re wrong too often at “90% sure.”\n4) Shrink confidence or widen ranges.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'calibration'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 3, longTerm: 8, identity: 6 },
    med: 'One confidence-tagged prediction',
    highIntensity: 'Weekly calibration review of past predictions',
    frequency: 'several_per_week',
    timeEstimateMinutes: 8,
  }),
  H({
    id: 'tfs-loss-aversion-aware',
    name: 'Loss-aversion awareness',
    description:
      'Why: Losses loom larger than gains; this distorts selling, quitting, and risk—name it when it freezes you.',
    how: '1) Notice clinginess to a losing position (stock, project, argument).\n2) Reframe as “future only.”\n3) Ask: if I didn’t own this, would I buy/start it today?\n4) Act on the forward view.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'bias'],
    difficulty: { time: 2, willpower: 6, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 6 },
    med: 'One “would I buy this today?” check',
    highIntensity: 'Exit or double-down with forward-only case',
    frequency: 'weekly',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'tfs-regression-mean',
    name: 'Regression-to-mean reminder',
    description:
      'Why: Extreme outcomes often reverse partly by chance; avoid over-explaining noise or overreacting to one spike.',
    how: '1) See an extreme result (performance, metric, praise/blame).\n2) Ask how much could be luck/variance.\n3) Avoid huge process changes after one outlier.\n4) Wait for more data or use baselines.',
    category: 'intelligence',
    secondaryTags: ['kahneman'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'One extreme outcome discounted for variance',
    highIntensity: 'Policy: no big pivots after n=1 extremes',
    frequency: 'several_per_week',
    timeEstimateMinutes: 8,
  }),
  H({
    id: 'tfs-outside-view',
    name: 'Outside view first',
    description:
      'Why: Kahneman/Flyvbjerg: start with reference class outcomes, then adjust for uniqueness—not the reverse.',
    how: '1) Define the class of similar projects/people.\n2) Note typical outcomes (time, cost, success rate).\n3) Only then adjust for your special case.\n4) Prefer the outside view when pride pushes uniqueness.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'decision'],
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Reference class named before custom story',
    highIntensity: 'Full outside-view estimate written first',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'tfs-substitution-catch',
    name: 'Catch attribute substitution',
    description:
      'Why: System 1 answers an easier question (likability, fluency) instead of the hard one—catch the swap.',
    how: '1) State the real question (e.g. “Is this a good hire/investment?”).\n2) Notice if you’re answering “Do I like them/it?”\n3) Force criteria for the hard question.\n4) Score on those criteria only.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'bias'],
    difficulty: { time: 2, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 6 },
    med: 'Catch one substituted question',
    highIntensity: 'Rubric for a hard decision, no likability proxy',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'tfs-intuition-domain',
    name: 'Intuition only in valid domains',
    description:
      'Why: Expert intuition works in high-validity, high-practice environments; elsewhere, distrust gut and use process.',
    how: '1) For a gut call, rate environment validity (stable patterns? feedback?).\n2) High validity + expertise → allow intuition.\n3) Low validity → slow process, base rates, experiments.\n4) Write which mode you used.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'decision'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: 'One gut call labeled valid/invalid domain',
    highIntensity: 'Decision policy: when gut is allowed',
    frequency: 'weekly',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'tfs-affect-heuristic',
    name: 'Affect heuristic pause',
    description:
      'Why: Likes and dislikes drive risk/benefit judgments; good feelings make risks look small. Separate feeling from risk numbers.',
    how: '1) Notice strong like/dislike coloring a risk call.\n2) List risks and benefits cold, in numbers where possible.\n3) Decide with the list, not the mood.\n4) Optional: sleep once if affect is hot.',
    category: 'intelligence',
    secondaryTags: ['kahneman', 'bias'],
    difficulty: { time: 2, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'One affect-vs-risk separation',
    highIntensity: 'Full risk/benefit table before hot decision',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),

  // ── Elon ───────────────────────────────────────────────────
  H({
    id: 'elon-first-principles',
    name: 'First-principles breakdown',
    description:
      'Why: Elon: reason from physics/fundamentals, not only analogy—“what must be true?” beats “what do others do?”',
    how: '1) State the problem.\n2) Strip analogies; list fundamental constraints and costs.\n3) Rebuild a solution from those truths.\n4) Compare to industry default; keep only better.',
    category: 'intelligence',
    secondaryTags: ['elon', 'thinking'],
    difficulty: { time: 4, willpower: 5, energy: 5 },
    effect: { shortTerm: 5, longTerm: 9, identity: 8 },
    med: '15-minute first-principles sketch',
    highIntensity: 'Full teardown + rebuilt option',
    frequency: 'several_per_week',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'elon-delete-requirement',
    name: 'Delete a dumb requirement',
    description:
      'Why: Elon’s algorithm starts with questioning requirements—many “musts” are legacy or politics.',
    how: '1) Pick a process, feature, or personal rule.\n2) Ask who owns the requirement and why it exists.\n3) Delete or suspend it if unjustified.\n4) Only then optimize what remains.',
    category: 'career',
    secondaryTags: ['elon', 'execution'],
    difficulty: { time: 3, willpower: 6, energy: 3 },
    effect: { shortTerm: 6, longTerm: 8, identity: 7 },
    med: 'Question and drop one requirement',
    highIntensity: 'Kill a major unnecessary constraint',
    frequency: 'weekly',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'elon-accelerate-cycle',
    name: 'Accelerate cycle time',
    description:
      'Why: Faster iteration learns more; shorten the loop from idea → test → feedback.',
    how: '1) Name a loop that is slow (build, review, decision).\n2) Cut wait states; parallelize; reduce batch size.\n3) Ship a thinner test this week.\n4) Measure loop time before/after.',
    category: 'career',
    secondaryTags: ['elon', 'execution'],
    difficulty: { time: 4, willpower: 5, energy: 5 },
    effect: { shortTerm: 6, longTerm: 8, identity: 7 },
    med: 'One loop shortened today',
    highIntensity: 'Redesign a multi-day loop into same-day',
    frequency: 'several_per_week',
    timeEstimateMinutes: 40,
  }),
  H({
    id: 'elon-reality-feedback',
    name: 'Reality feedback test',
    description:
      'Why: Physics and prototypes beat slideware; force contact with reality early.',
    how: '1) Convert an opinion into a falsifiable test.\n2) Run the smallest experiment or measurement.\n3) Update beliefs from the result.\n4) No more debate without new data.',
    category: 'career',
    secondaryTags: ['elon', 'execution'],
    difficulty: { time: 4, willpower: 5, energy: 5 },
    effect: { shortTerm: 6, longTerm: 9, identity: 7 },
    med: 'One small reality test',
    highIntensity: 'Prototype or measurement that can kill the idea',
    frequency: 'several_per_week',
    timeEstimateMinutes: 45,
  }),
  H({
    id: 'elon-urgency-block',
    name: 'Maniacal urgency block',
    description:
      'Why: Elon culture pushes extreme ownership and urgency on critical path—timebox like the mission depends on it (because sometimes it does).',
    how: '1) Identify the true critical-path task.\n2) Clear calendar friction for a hard block.\n3) Work as if delay is failure—no soft multitasking.\n4) End with a status of blockers only.',
    category: 'career',
    secondaryTags: ['elon', 'focus'],
    difficulty: { time: 6, willpower: 7, energy: 8 },
    effect: { shortTerm: 7, longTerm: 7, identity: 7 },
    med: '60-minute critical-path only',
    highIntensity: 'Half-day maniacal focus on one path',
    frequency: 'several_per_week',
    timeEstimateMinutes: 90,
  }),
  H({
    id: 'elon-automate-last',
    name: 'Automate only after manual works',
    description:
      'Why: Elon’s algorithm: automate last—after delete, simplify, accelerate—so you don’t automate waste.',
    how: '1) Confirm the process still needs to exist.\n2) Run it manually until stable.\n3) Only then script/automate the boring part.\n4) Kill automations that encode dumb process.',
    category: 'career',
    secondaryTags: ['elon', 'execution'],
    difficulty: { time: 4, willpower: 4, energy: 4 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: 'Refuse one premature automation',
    highIntensity: 'Manual path → then automate the proven path',
    frequency: 'weekly',
    timeEstimateMinutes: 30,
  }),

  // ── Steve Jobs ─────────────────────────────────────────────
  H({
    id: 'jobs-say-no',
    name: 'Focus by saying no',
    description:
      'Why: Jobs: focus means rejecting good ideas to protect the great few.',
    how: '1) List active projects/features/commitments.\n2) Kill or defer all but the vital few.\n3) Say no explicitly to one request today.\n4) Protect the remaining surface area.',
    category: 'career',
    secondaryTags: ['jobs', 'focus'],
    difficulty: { time: 2, willpower: 6, energy: 3 },
    effect: { shortTerm: 6, longTerm: 8, identity: 8 },
    med: 'One clear no',
    highIntensity: 'Cut the project list hard; communicate kills',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'jobs-end-to-end-craft',
    name: 'End-to-end craft pass',
    description:
      'Why: Jobs obsessed over the whole experience—including parts users rarely see. Quality is holistic.',
    how: '1) Pick a product/path you ship.\n2) Walk it as a new user end-to-end.\n3) Fix the worst friction or ugliness.\n4) Don’t leave “someone else’s layer” broken.',
    category: 'career',
    secondaryTags: ['jobs', 'craft'],
    difficulty: { time: 5, willpower: 5, energy: 5 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: 'One end-to-end walk + one fix',
    highIntensity: 'Full journey polish pass',
    frequency: 'weekly',
    timeEstimateMinutes: 45,
  }),
  H({
    id: 'jobs-simplify-interface',
    name: 'Simplify one interface',
    description:
      'Why: Simplicity is hard work; remove steps, options, and words until the essence remains.',
    how: '1) Choose a UI, doc, or personal workflow.\n2) Remove one step or option.\n3) Prefer fewer choices with better defaults.\n4) Test that the core job still works.',
    category: 'creativity',
    secondaryTags: ['jobs', 'design'],
    difficulty: { time: 4, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Remove one step/option',
    highIntensity: 'Redesign to half the complexity',
    frequency: 'weekly',
    timeEstimateMinutes: 40,
  }),
  H({
    id: 'jobs-high-bar-demo',
    name: 'High-bar demo rehearsal',
    description:
      'Why: Jobs treated demos as reality—rehearse until the experience is undeniable.',
    how: '1) Prepare a demo of your work as if for a hostile skeptic.\n2) Rehearse once timed.\n3) Fix the weakest 30 seconds.\n4) Demo to a real person if possible.',
    category: 'career',
    secondaryTags: ['jobs', 'communication'],
    difficulty: { time: 5, willpower: 5, energy: 5 },
    effect: { shortTerm: 6, longTerm: 7, identity: 7 },
    med: 'One timed rehearsal',
    highIntensity: 'Full demo to a human + iterate',
    frequency: 'weekly',
    timeEstimateMinutes: 40,
  }),
  H({
    id: 'jobs-taste-reference',
    name: 'Taste reference study',
    description:
      'Why: Taste is trained by studying great work deeply, not by average feeds.',
    how: '1) Pick one excellent product, film, essay, or design.\n2) Study why it works for 20–40 minutes.\n3) Extract 3 principles.\n4) Apply one principle to your work this week.',
    category: 'creativity',
    secondaryTags: ['jobs', 'taste'],
    difficulty: { time: 4, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 8, identity: 7 },
    med: '20 minutes deep study of excellence',
    highIntensity: '40 minutes + apply one principle today',
    frequency: 'weekly',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'jobs-walk-think',
    name: 'Walking thinking session',
    description:
      'Why: Jobs used long walks for serious conversation and thought—motion + dialogue clarifies hard problems.',
    how: '1) Schedule a walk with a hard topic (solo or with one person).\n2) No phones as entertainment.\n3) End with a decision or next experiment.\n4) Capture notes after, not during every step.',
    category: 'intelligence',
    secondaryTags: ['jobs', 'thinking'],
    difficulty: { time: 5, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: '20-minute thinking walk',
    highIntensity: '60–90 minute walk-meeting on one issue',
    frequency: 'several_per_week',
    timeEstimateMinutes: 35,
  }),

  // ── Paul Graham ────────────────────────────────────────────
  H({
    id: 'pg-make-something-people-want',
    name: 'Talk to a user / want check',
    description:
      'Why: PG: make something people want—contact with real demand beats elegant irrelevance.',
    how: '1) Speak with one user/customer/beneficiary.\n2) Ask what they did last time they felt the problem.\n3) Note willingness to pay or switch.\n4) Change the work if want is missing.',
    category: 'career',
    secondaryTags: ['pg', 'startup'],
    difficulty: { time: 4, willpower: 5, energy: 4 },
    effect: { shortTerm: 6, longTerm: 9, identity: 7 },
    med: 'One real user conversation',
    highIntensity: 'Three conversations + synthesis',
    frequency: 'several_per_week',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'pg-do-things-not-scale',
    name: 'Do things that don’t scale',
    description:
      'Why: Early progress is manual and awkward; PG urges unscalable hustle until the engine exists.',
    how: '1) Pick a growth or learning goal.\n2) Do the manual version (hand-onboard, hand-write, hand-sell).\n3) Learn what would need to scale later.\n4) Don’t wait for perfect automation.',
    category: 'career',
    secondaryTags: ['pg', 'startup'],
    difficulty: { time: 5, willpower: 5, energy: 5 },
    effect: { shortTerm: 6, longTerm: 8, identity: 7 },
    med: 'One unscalable manual push',
    highIntensity: 'Half-day of manual high-touch work',
    frequency: 'weekly',
    timeEstimateMinutes: 60,
  }),
  H({
    id: 'pg-schlep-blindness',
    name: 'Attack a schlep',
    description:
      'Why: Schlep blindness: we avoid tedious hard problems that are actually valuable. Do the schlep.',
    how: '1) List ugly tasks you’ve been dodging.\n2) Pick the valuable schlep.\n3) Timebox an honest attack.\n4) Note what became possible after.',
    category: 'career',
    secondaryTags: ['pg', 'execution'],
    difficulty: { time: 5, willpower: 6, energy: 5 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: '45 minutes on a dodged schlep',
    highIntensity: 'Finish a multi-hour schlep chunk',
    frequency: 'weekly',
    timeEstimateMinutes: 60,
  }),
  H({
    id: 'pg-launch-early',
    name: 'Launch something thin early',
    description:
      'Why: PG: release early—feedback from reality beats private perfectionism.',
    how: '1) Define a embarrassingly thin version.\n2) Ship to at least one external human.\n3) Collect reaction.\n4) Iterate from truth not fantasy.',
    category: 'career',
    secondaryTags: ['pg', 'startup'],
    difficulty: { time: 5, willpower: 6, energy: 6 },
    effect: { shortTerm: 6, longTerm: 8, identity: 7 },
    med: 'Ship a thin version to one person',
    highIntensity: 'Public or multi-user thin launch',
    frequency: 'weekly',
    timeEstimateMinutes: 90,
  }),
  H({
    id: 'pg-write-to-think',
    name: 'Write like an essayist',
    description:
      'Why: PG’s essays show writing as thinking—clear prose reveals confusion and creates leverage.',
    how: '1) Pick a belief or decision.\n2) Write a short essay-like note with full sentences.\n3) Cut fluff; keep the sharp claim.\n4) Optional: publish or share.',
    category: 'intelligence',
    secondaryTags: ['pg', 'writing'],
    difficulty: { time: 4, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: '400–800 words thinking essay',
    highIntensity: 'Publishable essay draft',
    frequency: 'weekly',
    timeEstimateMinutes: 45,
  }),
  H({
    id: 'pg-stay-upwind',
    name: 'Stay upwind (hard problems)',
    description:
      'Why: PG: work on problems that compound skill and optionality—“upwind” technical/human challenges.',
    how: '1) List problems you could work on.\n2) Rank by how much they teach hard transferable skill.\n3) Move hours toward the upwind problem.\n4) Drop a downwind busy problem.',
    category: 'career',
    secondaryTags: ['pg', 'career'],
    difficulty: { time: 3, willpower: 5, energy: 4 },
    effect: { shortTerm: 4, longTerm: 9, identity: 8 },
    med: 'Reallocate one block to harder problem',
    highIntensity: 'Weekly plan rewritten around upwind work',
    frequency: 'weekly',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'pg-relentlessly-resourceful',
    name: 'Resourceful path around a wall',
    description:
      'Why: PG prizes relentless resourcefulness—find a way, not an excuse.',
    how: '1) Name a blocked goal.\n2) List 5 alternate paths (people, tools, hacks, scopes).\n3) Try the least dignified path that works.\n4) Log what unblocked you.',
    category: 'career',
    secondaryTags: ['pg', 'execution'],
    difficulty: { time: 3, willpower: 6, energy: 5 },
    effect: { shortTerm: 6, longTerm: 8, identity: 8 },
    med: 'Five alternate paths + try one',
    highIntensity: 'Unblock a stuck goal same day',
    frequency: 'several_per_week',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'pg-ignore-prestige',
    name: 'Ignore prestige filter',
    description:
      'Why: Prestige warps young ambitious people toward crowded, approved paths; PG says follow interesting/hard truth instead.',
    how: '1) Notice a choice driven by status optics.\n2) Re-rank by learning, impact, or curiosity.\n3) Prefer the unprestigious high-upside option when real.\n4) One status-driven item dropped.',
    category: 'career',
    secondaryTags: ['pg', 'career'],
    difficulty: { time: 2, willpower: 6, energy: 3 },
    effect: { shortTerm: 3, longTerm: 8, identity: 8 },
    med: 'Catch one prestige-driven preference',
    highIntensity: 'Redirect a major effort off prestige path',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),

  // ── From Life Protocols / Grok chat themes ─────────────────
  H({
    id: 'lp-forming-cap',
    name: 'Respect the forming cap',
    description:
      'Why: From your Life Protocols design—~6 forming habits max keeps change sustainable for a demanding life.',
    how: '1) Count current forming habits.\n2) If >6, promote, pause, or remove until ≤6.\n3) Only add a new forming habit when a slot opens.\n4) Formed habits can stay many; forming is the scarce slot.',
    category: 'career',
    secondaryTags: ['life-protocols', 'systems'],
    difficulty: { time: 1, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: 'Audit forming count; cut to ≤6',
    highIntensity: 'Full active set prune + promote session',
    frequency: 'weekly',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'lp-balance-weakest',
    name: 'Feed the weakest category',
    description:
      'Why: Your hex radar goal—balance across six life categories; deliberately feed the weakest axis.',
    how: '1) Note the weakest category (health, intellect, social, finance, career, creativity).\n2) Activate or hit one habit in that category today.\n3) Don’t only double down on strengths.\n4) Recheck the radar after a week.',
    category: 'career',
    secondaryTags: ['life-protocols', 'balance'],
    difficulty: { time: 2, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'One action in the weakest category',
    highIntensity: 'Add a forming habit in weakest + complete a hit',
    frequency: 'several_per_week',
    timeEstimateMinutes: 20,
  }),
  H({
    id: 'lp-high-signal-only',
    name: 'High-signal habit audit',
    description:
      'Why: Life Protocols / Elon method: delete fluffy low-signal habits; keep only what moves the needle for a hard-training, hard-working adult.',
    how: '1) Review active habits.\n2) Mark fluffy or guilt-only items.\n3) Remove or replace with a sharper protocol.\n4) Prefer MED versions over performative intensity.',
    category: 'career',
    secondaryTags: ['life-protocols', 'elon-method'],
    difficulty: { time: 2, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 6 },
    med: 'Remove one low-signal habit',
    highIntensity: 'Full library prune of active set',
    frequency: 'weekly',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'lp-med-first',
    name: 'Do the MED version',
    description:
      'Why: Minimum effective dose keeps consistency when life is full—compounding beats heroic streaks that break.',
    how: '1) For today’s key habit, read its MED.\n2) Do only MED if energy is limited.\n3) Log the hit—MED counts.\n4) Save high-intensity for planned days.',
    category: 'health',
    secondaryTags: ['life-protocols', 'consistency'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'Complete one habit at MED only',
    highIntensity: 'MED across all forming habits today',
    frequency: 'daily',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'lp-export-backup',
    name: 'Export / backup protocols',
    description:
      'Why: Local-first apps die with browser storage; your own design called for periodic export so progress isn’t lost.',
    how: '1) Use Export in Life Protocols (or backup your notes system).\n2) Save the file to cloud/drive.\n3) Confirm date stamp.\n4) Monthly minimum; weekly if heavy use.',
    category: 'career',
    secondaryTags: ['life-protocols', 'systems'],
    difficulty: { time: 1, willpower: 2, energy: 1 },
    effect: { shortTerm: 2, longTerm: 6, identity: 3 },
    med: 'One export saved off-device',
    highIntensity: 'Export + test import on clean profile',
    frequency: 'weekly',
    timeEstimateMinutes: 5,
  }),
  H({
    id: 'lp-two-minute-review',
    name: 'Two-minute plan review',
    description:
      'Why: Design goal: assemble/review the week’s protocol in under ~2 minutes—speed keeps the system alive.',
    how: '1) Open active plan.\n2) Check targets and weakest category.\n3) Adjust one habit or target only.\n4) Stop at two minutes—no infinite tinkering.',
    category: 'career',
    secondaryTags: ['life-protocols', 'systems'],
    difficulty: { time: 1, willpower: 2, energy: 1 },
    effect: { shortTerm: 4, longTerm: 6, identity: 4 },
    med: 'Timed 2-minute review',
    highIntensity: '2-minute review + one structural change',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),
]

let addedH = 0
for (const h of newHabits) {
  if (have.has(h.id)) continue
  habits.push(h)
  have.add(h.id)
  addedH++
}

// refresh have after adds
for (const h of habits) have.add(h.id)

const newPacks = [
  // More like Core tools
  {
    id: 'mental-models-systems',
    name: 'Mental models · Systems & leverage',
    description:
      'Core-tools style: feedback loops, bottlenecks, Pareto, margin of safety, via negativa, asymmetric bets.',
    habitIds: [
      'mm-feedback-loops',
      'mm-bottleneck',
      'mm-pareto',
      'mm-margin-of-safety',
      'mm-via-negativa',
      'mm-asymmetric-bets',
    ],
  },
  {
    id: 'mental-models-judgment',
    name: 'Mental models · Judgment hygiene',
    description:
      'Core-tools style: incentives, map≠territory, sunk cost, probabilistic forecasts, skin in the game, local-optima escape.',
    habitIds: [
      'mm-incentives',
      'mm-map-territory',
      'mm-sunk-cost',
      'mm-probabilistic',
      'mm-skin-in-game',
      'mm-local-vs-global',
    ],
  },
  {
    id: 'mental-models-decisions-daily',
    name: 'Mental models · Daily decisions',
    description:
      'Everyday toolkit: inversion, second-order, base rates, opportunity cost, circle of competence, System-2 slowdown.',
    habitIds: [
      'mm-inversion',
      'mm-second-order',
      'mm-base-rates',
      'mm-opportunity-cost',
      'mm-circle-of-competence',
      'tfs-system2-slowdown',
    ],
  },

  // Thinking Fast and Slow
  {
    id: 'kahneman-bias-basic',
    name: 'Thinking Fast & Slow · Bias basics',
    description:
      'Catch System-1 traps: WYSIATI, anchoring, availability, substitution, affect heuristic, overconfidence.',
    habitIds: [
      'tfs-wysiati',
      'tfs-anchoring-reset',
      'tfs-availability-audit',
      'tfs-substitution-catch',
      'tfs-affect-heuristic',
      'tfs-overconfidence-calibrate',
    ],
  },
  {
    id: 'kahneman-decisions',
    name: 'Thinking Fast & Slow · Better decisions',
    description:
      'Outside view, planning fallacy buffers, loss aversion, regression to mean, intuition domains, System-2 slowdown.',
    habitIds: [
      'tfs-outside-view',
      'tfs-planning-fallacy',
      'tfs-loss-aversion-aware',
      'tfs-regression-mean',
      'tfs-intuition-domain',
      'tfs-system2-slowdown',
    ],
  },
  {
    id: 'kahneman-work-practice',
    name: 'Thinking Fast & Slow · At work',
    description:
      'Apply Kahneman at work: premortem, base rates, write-to-clarify, hypothesis-validate, planning buffer, single-task.',
    habitIds: [
      'calm-premortem-calm',
      'mm-base-rates',
      'intel-write-to-clarify',
      'intel-hypothesis-validate',
      'tfs-planning-fallacy',
      'calm-single-task',
    ],
  },

  // Elon
  {
    id: 'elon-algorithm',
    name: 'Elon · The algorithm',
    description:
      'Question requirements, delete, simplify/via negativa, accelerate cycles, reality tests, automate last.',
    habitIds: [
      'elon-delete-requirement',
      'mm-via-negativa',
      'elon-accelerate-cycle',
      'elon-reality-feedback',
      'elon-automate-last',
      'elon-first-principles',
    ],
  },
  {
    id: 'elon-execution',
    name: 'Elon · Execution intensity',
    description:
      'Critical-path urgency, first principles, ship weekly, bottleneck hunting, deep work, top-3 force rank.',
    habitIds: [
      'elon-urgency-block',
      'elon-first-principles',
      'career-ship-weekly',
      'mm-bottleneck',
      'intel-deep-work',
      'career-top3-force-rank',
    ],
  },

  // Jobs
  {
    id: 'jobs-focus-craft',
    name: 'Steve Jobs · Focus & craft',
    description:
      'Say no, end-to-end craft, simplify interfaces, high-bar demos, taste study, walking thinking.',
    habitIds: [
      'jobs-say-no',
      'jobs-end-to-end-craft',
      'jobs-simplify-interface',
      'jobs-high-bar-demo',
      'jobs-taste-reference',
      'jobs-walk-think',
    ],
  },
  {
    id: 'jobs-product-sense',
    name: 'Steve Jobs · Product sense',
    description:
      'User-visible quality: craft pass, simplify, demo bar, ship weekly, feedback loop, make for someone.',
    habitIds: [
      'jobs-end-to-end-craft',
      'jobs-simplify-interface',
      'jobs-high-bar-demo',
      'career-ship-weekly',
      'career-feedback-loop',
      'create-make-for-someone',
    ],
  },

  // Paul Graham
  {
    id: 'pg-startup-habits',
    name: 'Paul Graham · Startup habits',
    description:
      'Make something people want, don’t-scale hustle, schlep, launch early, resourcefulness, stay upwind.',
    habitIds: [
      'pg-make-something-people-want',
      'pg-do-things-not-scale',
      'pg-schlep-blindness',
      'pg-launch-early',
      'pg-relentlessly-resourceful',
      'pg-stay-upwind',
    ],
  },
  {
    id: 'pg-thinker-builder',
    name: 'Paul Graham · Thinker-builder',
    description:
      'Write to think, ignore prestige, upwind work, ship/launch thin, user truth, clear essays of belief.',
    habitIds: [
      'pg-write-to-think',
      'pg-ignore-prestige',
      'pg-stay-upwind',
      'pg-launch-early',
      'pg-make-something-people-want',
      'intel-write-to-clarify',
    ],
  },

  // From Grok / Life Protocols chat
  {
    id: 'life-protocols-system',
    name: 'Life Protocols · Run the system',
    description:
      'From your Grok design: forming cap, weakest-category feed, high-signal audit, MED-first, export backup, 2-minute review.',
    habitIds: [
      'lp-forming-cap',
      'lp-balance-weakest',
      'lp-high-signal-only',
      'lp-med-first',
      'lp-export-backup',
      'lp-two-minute-review',
    ],
  },
  {
    id: 'life-protocols-pro-stack',
    name: 'Life Protocols · Demanding pro stack',
    description:
      'For hard-training + hard-tech work: sleep lock, deep work, top-3, ship weekly, recovery Zone-2, relationship CRM.',
    habitIds: [
      'health-sleep-window',
      'intel-deep-work',
      'career-top3-force-rank',
      'career-ship-weekly',
      'health-zone2-recovery',
      'social-relationship-crm',
    ],
  },
  {
    id: 'life-protocols-elon-method',
    name: 'Life Protocols · Elon method live',
    description:
      'Requirements less dumb: delete requirement, via negativa, accelerate, automate last, high-signal audit, obvious problems.',
    habitIds: [
      'elon-delete-requirement',
      'mm-via-negativa',
      'elon-accelerate-cycle',
      'elon-automate-last',
      'lp-high-signal-only',
      'career-obvious-problems',
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
    console.error('LEN', p.id, p.habitIds.length)
    process.exit(1)
  }
  const idx = packs.findIndex((x) => x.id === p.id)
  if (idx >= 0) packs[idx] = p
  else {
    packs.push(p)
    addedP++
  }
}

// Strip any pack that still references removed habits and isn't 6
packs = packs.filter((p) => p.habitIds.length === 6)

writeFileSync(habitsPath, JSON.stringify(habits, null, 2) + '\n')
writeFileSync(packsPath, JSON.stringify(packs, null, 2) + '\n')

console.log(
  JSON.stringify(
    {
      removedPack: REMOVE_PACK,
      removedHabits: [...REMOVE_HABITS],
      habits: habits.length,
      addedHabits: addedH,
      packs: packs.length,
      addedPacks: addedP,
      mmPacks: packs.filter((p) => p.id.includes('mental-models')).map((p) => p.name),
    },
    null,
    2,
  ),
)
