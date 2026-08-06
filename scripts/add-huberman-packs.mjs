/**
 * Expand Huberman Lab–aligned protocols + 6-habit packs.
 * Educational synthesis of commonly discussed Huberman Lab themes
 * (sleep, light, learning, breath, dopamine, vision, fitness, creativity).
 * Not medical advice; not an official Huberman product.
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

function H(partial) {
  return {
    secondaryTags: ['huberman'],
    source: 'core',
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: '',
    highIntensity: '',
    ...partial,
    secondaryTags: [
      'huberman',
      ...(partial.secondaryTags || []).filter((t) => t !== 'huberman'),
    ],
  }
}

const newHabits = [
  // ── Learning ───────────────────────────────────────────────
  H({
    id: 'hub-ultradian-learn',
    name: 'Ultradian learning block',
    description:
      'Why: Huberman frames deep learning in ~90-minute ultradian bouts of focused encoding, then rest—matching natural alertness cycles.',
    how: '1) Pick one skill/topic.\n2) Work 50–90 minutes with phone away.\n3) Stay with productive struggle; minimize tab-switching.\n4) End the block deliberately; then rest or NSDR.',
    category: 'intelligence',
    secondaryTags: ['learning', 'focus'],
    difficulty: { time: 6, willpower: 6, energy: 6 },
    effect: { shortTerm: 6, longTerm: 9, identity: 7 },
    med: '50-minute single-topic block',
    highIntensity: 'Full ~90 minutes + notes of what failed',
    frequency: 'several_per_week',
    timeEstimateMinutes: 70,
  }),
  H({
    id: 'hub-retrieval-practice',
    name: 'Retrieval practice',
    description:
      'Why: Testing yourself beats re-reading for durable memory—core learning science Huberman emphasizes for neuroplasticity.',
    how: '1) Close notes/book.\n2) Write or speak everything you can recall.\n3) Check gaps; re-encode only misses.\n4) Repeat across days (spacing).',
    category: 'intelligence',
    secondaryTags: ['learning', 'memory'],
    difficulty: { time: 3, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 9, identity: 6 },
    med: '10 minutes free recall',
    highIntensity: '30 minutes free recall + spaced cards',
    frequency: 'several_per_week',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'hub-error-learning',
    name: 'Error-driven learning',
    description:
      'Why: Errors + attention release neuromodulators that open plasticity; Huberman stresses leaning into mistakes rather than only easy success.',
    how: '1) Choose a drill slightly above comfort.\n2) Attempt before peeking at answers.\n3) Mark each error without shame.\n4) Correct immediately; log one pattern of mistakes.',
    category: 'intelligence',
    secondaryTags: ['learning'],
    difficulty: { time: 4, willpower: 5, energy: 5 },
    effect: { shortTerm: 5, longTerm: 8, identity: 7 },
    med: '15 minutes hard practice with errors allowed',
    highIntensity: '40 minutes deliberate fail-forward drill',
    frequency: 'several_per_week',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'hub-teach-back',
    name: 'Teach-back / explain aloud',
    description:
      'Why: Generation and teaching force deeper encoding; Huberman often recommends explaining material in plain language to lock learning.',
    how: '1) After a learning bout, explain the idea out loud or on paper as if teaching a smart novice.\n2) No jargon crutches.\n3) Note where explanation breaks—those are gaps.\n4) Optionally record a 3-minute voice note.',
    category: 'intelligence',
    secondaryTags: ['learning'],
    difficulty: { time: 3, willpower: 4, energy: 4 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: '5-minute teach-back',
    highIntensity: '15-minute whiteboard or voice explanation',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'hub-space-repetitions',
    name: 'Spaced repetition pass',
    description:
      'Why: Spacing beats massed cramming for long-term retention—Huberman cites sleep + spaced re-exposure as plasticity multipliers.',
    how: '1) Revisit material from 1+ days ago (not only today’s).\n2) Use cards, summary, or re-solve problems.\n3) Prioritize weak items.\n4) Keep sessions short and frequent.',
    category: 'intelligence',
    secondaryTags: ['learning', 'memory'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 9, identity: 5 },
    med: '10 minutes spaced review',
    highIntensity: '25 minutes + rewrite weak cards',
    frequency: 'daily',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'hub-sleep-after-learn',
    name: 'Sleep same day as hard learning',
    description:
      'Why: Sleep consolidates learning; Huberman stresses not sacrificing night sleep after intense study or skill practice.',
    how: '1) Schedule hard learning earlier enough to protect bedtime.\n2) Avoid all-nighters after encoding.\n3) If sleep-deprived, use NSDR and re-learn later—don’t stack debt.\n4) Log: learning day → target sleep window held.',
    category: 'intelligence',
    secondaryTags: ['learning', 'sleep'],
    difficulty: { time: 1, willpower: 6, energy: 2 },
    effect: { shortTerm: 5, longTerm: 9, identity: 6 },
    med: 'Protect sleep after any major learning day',
    highIntensity: 'Full consistent schedule + NSDR if short',
    frequency: 'several_per_week',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-visual-focus-spotlight',
    name: 'Visual focus spotlight',
    description:
      'Why: Narrowing visual attention (staring at a target) can increase mental focus; Huberman links ocular focus to cognitive focus.',
    how: '1) Before deep work, pick a visual target at arm’s length or on screen edge.\n2) Hold soft, steady gaze 30–60 seconds.\n3) Then begin the cognitive task.\n4) If mind drifts, briefly re-anchor gaze and return.',
    category: 'intelligence',
    secondaryTags: ['focus', 'vision'],
    difficulty: { time: 1, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 6, identity: 4 },
    med: '30-second gaze anchor',
    highIntensity: '2 minutes deliberate visual focus then work',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),
  H({
    id: 'hub-interleave-practice',
    name: 'Interleaved practice',
    description:
      'Why: Mixing related skills (interleaving) often beats blocked drills for transfer—advanced learning protocol aligned with plasticity research Huberman discusses.',
    how: '1) Pick 2–3 related sub-skills.\n2) Rotate short bouts rather than one skill for the whole session.\n3) Keep difficulty high enough to make errors.\n4) End with 2-minute summary of patterns.',
    category: 'intelligence',
    secondaryTags: ['learning'],
    difficulty: { time: 5, willpower: 5, energy: 5 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: '25 minutes rotating two skills',
    highIntensity: '50 minutes three-skill interleave',
    frequency: 'several_per_week',
    timeEstimateMinutes: 35,
  }),
  H({
    id: 'hub-generation-effect',
    name: 'Try before answer (generation)',
    description:
      'Why: Attempting retrieval or solution before seeing the answer strengthens encoding—the generation effect Huberman-aligned learning science supports.',
    how: '1) Cover the solution.\n2) Produce your best attempt first.\n3) Only then reveal and correct.\n4) Note the delta in one line.',
    category: 'intelligence',
    secondaryTags: ['learning'],
    difficulty: { time: 3, willpower: 5, energy: 4 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'One problem/topic with attempt-first',
    highIntensity: 'Full practice set attempt-first',
    frequency: 'several_per_week',
    timeEstimateMinutes: 20,
  }),
  H({
    id: 'hub-handwrite-notes',
    name: 'Handwrite key notes',
    description:
      'Why: Handwriting can improve processing versus pure typing for some learners; Huberman often encourages analog capture during learning bouts.',
    how: '1) During or after learning, write main ideas by hand.\n2) Use full phrases, not only doodles.\n3) Limit to one page.\n4) Optional photo archive later.',
    category: 'intelligence',
    secondaryTags: ['learning'],
    difficulty: { time: 3, willpower: 3, energy: 3 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'Half page handwritten summary',
    highIntensity: 'Full page structured notes',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),

  // ── Creativity ─────────────────────────────────────────────
  H({
    id: 'hub-default-mode-walk',
    name: 'Undistracted mind-wander walk',
    description:
      'Why: Default-mode mind-wandering supports creative insight; Huberman often recommends walks without podcasts/phone for idea generation.',
    how: '1) Walk 10–30 minutes.\n2) No podcast, no scrolling, no calls.\n3) Let thoughts roam; optionally capture one idea at the end.\n4) Outdoor if possible.',
    category: 'creativity',
    secondaryTags: ['creativity', 'walk'],
    difficulty: { time: 4, willpower: 5, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 6 },
    med: '10-minute silent walk',
    highIntensity: '30-minute outdoor undistracted walk',
    frequency: 'several_per_week',
    timeEstimateMinutes: 20,
  }),
  H({
    id: 'hub-morning-create-first',
    name: 'Create before cheap dopamine',
    description:
      'Why: Morning dopamine baseline is fragile; Huberman advises delaying phone/social so early creative or hard work isn’t undercut by cheap rewards.',
    how: '1) After light/move, do 20–45 minutes of creative or hard make-work.\n2) Phone still offline or in another room.\n3) Define one output (sketch, draft, riff, design).\n4) Only then open messages if needed.',
    category: 'creativity',
    secondaryTags: ['creativity', 'dopamine'],
    difficulty: { time: 5, willpower: 7, energy: 5 },
    effect: { shortTerm: 6, longTerm: 8, identity: 8 },
    med: '20 minutes create-first',
    highIntensity: '45–60 minutes deep create before phone',
    frequency: 'daily',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'hub-nsdr-for-insight',
    name: 'NSDR after creative struggle',
    description:
      'Why: NSDR after effort can support consolidation and insight; Huberman links non-sleep deep rest to learning and mental reset useful for creative work.',
    how: '1) Do a hard creative bout first.\n2) Immediately do 10–20 min NSDR/Yoga Nidra.\n3) Capture any ideas that surface after.\n4) Don’t replace night sleep with NSDR.',
    category: 'creativity',
    secondaryTags: ['creativity', 'recovery'],
    difficulty: { time: 4, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: '10 min NSDR after creating',
    highIntensity: '20 min NSDR + idea capture',
    frequency: 'several_per_week',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'hub-novelty-input',
    name: 'Deliberate novelty input',
    description:
      'Why: Novelty stimulates neuromodulators and creative recombination; Huberman discusses new experiences as fuel—not endless scrolling.',
    how: '1) Pick one novel but high-quality input (place, genre, technique, person).\n2) Engage 20–40 minutes with attention.\n3) Note one connection to your work.\n4) Avoid passive doomscroll as “novelty.”',
    category: 'creativity',
    secondaryTags: ['creativity'],
    difficulty: { time: 4, willpower: 3, energy: 3 },
    effect: { shortTerm: 5, longTerm: 7, identity: 6 },
    med: '15 minutes novel high-quality input',
    highIntensity: '40 minutes + written transfer note',
    frequency: 'weekly',
    timeEstimateMinutes: 30,
  }),
  H({
    id: 'hub-limit-context-switch',
    name: 'Single-context create block',
    description:
      'Why: Context switching burns focus and dopamine; Huberman’s focus protocols favor one cognitive context at a time for quality output.',
    how: '1) One creative project only for the block.\n2) Close other docs/chats.\n3) 25–50 minutes uninterrupted.\n4) Batch admin after, not during.',
    category: 'creativity',
    secondaryTags: ['creativity', 'focus'],
    difficulty: { time: 4, willpower: 6, energy: 5 },
    effect: { shortTerm: 6, longTerm: 7, identity: 6 },
    med: '25-minute single-project block',
    highIntensity: '50-minute deep create, one tab/doc',
    frequency: 'several_per_week',
    timeEstimateMinutes: 35,
  }),
  H({
    id: 'hub-play-without-goal',
    name: 'Goal-free play bout',
    description:
      'Why: Play without optimization supports creativity and recovery from goal-stacking—aligned with Huberman themes on balancing effort and reward.',
    how: '1) Pick play with no KPI (instrument, sketch, game of pure fun).\n2) Set a timer 15–30 minutes.\n3) No recording for “content.”\n4) Stop when timer ends.',
    category: 'creativity',
    secondaryTags: ['creativity', 'play'],
    difficulty: { time: 3, willpower: 4, energy: 2 },
    effect: { shortTerm: 6, longTerm: 6, identity: 6 },
    med: '15 minutes pure play',
    highIntensity: '30–45 minutes undirected play',
    frequency: 'several_per_week',
    timeEstimateMinutes: 20,
  }),

  // ── Breath ─────────────────────────────────────────────────
  H({
    id: 'hub-nasal-default',
    name: 'Nasal breathing default',
    description:
      'Why: Huberman often recommends nasal breathing at rest and during easy exercise for airway health, nitric oxide, and calmer autonomic tone.',
    how: '1) Keep mouth closed during easy walks/desk work when comfortable.\n2) If congested, gentle clear; don’t force through pain.\n3) During hard intervals, mouth may open—return to nose in recovery.\n4) Check-in 3× daily: am I mouth-breathing unnecessively?',
    category: 'health',
    secondaryTags: ['breath'],
    difficulty: { time: 1, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'Nasal default for easy activity only',
    highIntensity: 'Full day nasal-default awareness + walk',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-long-exhale',
    name: 'Long-exhale calm set',
    description:
      'Why: Longer exhales bias parasympathetic tone; Huberman teaches exhale-emphasized breathing to reduce stress quickly.',
    how: '1) Inhale calmly through nose ~3–4 s.\n2) Exhale longer ~6–8 s through nose or pursed lips.\n3) Repeat 5–10 cycles.\n4) Use before sleep or after stress spikes.',
    category: 'health',
    secondaryTags: ['breath', 'stress'],
    difficulty: { time: 2, willpower: 2, energy: 1 },
    effect: { shortTerm: 6, longTerm: 6, identity: 4 },
    med: '5 long-exhale cycles',
    highIntensity: '5 minutes continuous long-exhale practice',
    frequency: 'daily',
    timeEstimateMinutes: 4,
  }),
  H({
    id: 'hub-box-breathing',
    name: 'Box breathing set',
    description:
      'Why: Equal-count box breathing is a simple Huberman-adjacent focus/calm tool for steadying arousal before performance.',
    how: '1) Inhale 4 counts, hold 4, exhale 4, hold 4 (adjust length to comfort).\n2) Repeat 4–8 boxes.\n3) Sit upright; nasal preferred.\n4) Use pre-meeting or pre-deep-work.',
    category: 'health',
    secondaryTags: ['breath', 'focus'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 6, identity: 4 },
    med: '4 boxes',
    highIntensity: '8 boxes or longer counts',
    frequency: 'daily',
    timeEstimateMinutes: 5,
  }),
  H({
    id: 'hub-physiological-sigh-stack',
    name: 'Physiological sigh on stress spike',
    description:
      'Why: Real-time use of the double inhale + long exhale when stress hits—Huberman’s go-to acute anxiety tool (distinct from scheduled cyclic sighing practice).',
    how: '1) Notice spike (email, conflict, rumination).\n2) Immediately: double nasal inhale + long mouth exhale ×1–3.\n3) Resume task only after one clear breath.\n4) Optional log of triggers.',
    category: 'health',
    secondaryTags: ['breath', 'stress'],
    difficulty: { time: 1, willpower: 3, energy: 1 },
    effect: { shortTerm: 7, longTerm: 6, identity: 5 },
    med: 'Use at least once on a real spike',
    highIntensity: 'Use on every noticed spike that day',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),
  H({
    id: 'hub-co2-tolerance',
    name: 'CO₂ tolerance walk',
    description:
      'Why: Comfort with elevated CO₂ relates to calm under stress; Huberman discusses nasal/exhale training and controlled breath holds in safe contexts (never forced underwater).',
    how: '1) Easy walk, nasal only.\n2) Occasionally extend exhale comfort—not to dizziness.\n3) Stop if lightheaded.\n4) 5–15 minutes total.',
    category: 'health',
    secondaryTags: ['breath'],
    difficulty: { time: 3, willpower: 4, energy: 3 },
    effect: { shortTerm: 4, longTerm: 6, identity: 4 },
    med: '5-minute nasal walk with longer exhales',
    highIntensity: '15-minute nasal walk, controlled extended exhales',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'hub-cyclic-hyperventilation-caution',
    name: 'Cyclic hyperventilation (safe dose)',
    description:
      'Why: Huberman discusses cyclic hyperventilation (Wim Hof–like) for adrenaline; use sparingly, seated/lying, never near water, stop if unsafe—advanced voluntary stressor.',
    how: '1) Sit or lie down safely (not in water/driving).\n2) 25–30 deep breaths, then exhale and hold comfortably empty until urge to breathe.\n3) Recover breath; 1–3 rounds max.\n4) Skip if pregnant, seizure history, or unwell; this is optional advanced.',
    category: 'health',
    secondaryTags: ['breath', 'stress', 'advanced'],
    difficulty: { time: 3, willpower: 5, energy: 4 },
    effect: { shortTerm: 6, longTerm: 5, identity: 5 },
    med: 'One careful round',
    highIntensity: 'Up to 3 rounds, fully recovered between',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'hub-pre-sleep-breath',
    name: 'Pre-sleep physiological sighs',
    description:
      'Why: Slow breathing and physiological sighs before bed can downshift arousal—part of Huberman’s sleep toolkit when mind is racing.',
    how: '1) Lights dim; in bed or chair.\n2) 5–10 physiological double sighs or long-exhale sets.\n3) No phone during the set.\n4) Transition to sleep without rechecking screens.',
    category: 'health',
    secondaryTags: ['breath', 'sleep'],
    difficulty: { time: 2, willpower: 3, energy: 1 },
    effect: { shortTerm: 6, longTerm: 7, identity: 5 },
    med: '5 physiological sighs in bed',
    highIntensity: '10 minutes exhale-focused wind-down',
    frequency: 'daily',
    timeEstimateMinutes: 5,
  }),

  // ── Dopamine / motivation ──────────────────────────────────
  H({
    id: 'hub-effort-then-reward',
    name: 'Effort before reward',
    description:
      'Why: Huberman’s dopamine framework: random/cheap rewards blunt motivation; put effort first, then deliberate reward.',
    how: '1) Name the hard effort block first.\n2) Complete it before preferred treat (snack, episode, social scroll).\n3) Keep reward proportional—not a binge.\n4) One clear effort→reward chain per day minimum.',
    category: 'career',
    secondaryTags: ['dopamine', 'motivation'],
    difficulty: { time: 2, willpower: 6, energy: 3 },
    effect: { shortTerm: 5, longTerm: 8, identity: 8 },
    med: 'One effort-then-reward chain',
    highIntensity: 'All major rewards gated behind effort',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-intermittent-reward',
    name: 'Intermittent (not constant) reward',
    description:
      'Why: Constant reward predictability flattens dopamine peaks; Huberman advises intermittent celebration of wins.',
    how: '1) Do not reward every micro-task.\n2) After a meaningful win, sometimes celebrate, sometimes just log and continue.\n3) Avoid stacking layers of rewards for one task.\n4) Weekly: one deliberate celebration only.',
    category: 'career',
    secondaryTags: ['dopamine'],
    difficulty: { time: 1, willpower: 5, energy: 2 },
    effect: { shortTerm: 3, longTerm: 8, identity: 7 },
    med: 'Skip reward on one completed micro-task',
    highIntensity: 'Full day of intermittent-only rewards',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-dopamine-fast-window',
    name: 'Low-dopamine morning window',
    description:
      'Why: Protecting morning from stacked stimulants/social media preserves motivation—Huberman dopamine baseline protocol.',
    how: '1) First 60–120 min: no social feeds, no junk video, minimal novelty apps.\n2) Light, move, hydrate, work or create.\n3) Caffeine delayed if that’s your rule.\n4) Open high-dopamine apps only after the window.',
    category: 'intelligence',
    secondaryTags: ['dopamine', 'focus'],
    difficulty: { time: 1, willpower: 8, energy: 2 },
    effect: { shortTerm: 6, longTerm: 8, identity: 8 },
    med: '60-minute low-dopamine window',
    highIntensity: '120 minutes + phone in other room',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-cold-for-dopamine',
    name: 'Cold for long dopamine tone',
    description:
      'Why: Deliberate cold can elevate dopamine for hours in studied protocols Huberman cites—use as a mood/motivation tool, not punishment.',
    how: '1) Uncomfortably cold but safe exposure (shower finish or immersion).\n2) 1–3+ minutes depending on tolerance; build weekly minutes.\n3) Breathe calmly; never hyperventilate in water.\n4) Prefer morning/midday if it disrupts sleep.',
    category: 'health',
    secondaryTags: ['dopamine', 'cold'],
    difficulty: { time: 2, willpower: 7, energy: 4 },
    effect: { shortTerm: 7, longTerm: 6, identity: 6 },
    med: '90-second cold shower finish',
    highIntensity: '3–5 minutes cold immersion (safe)',
    frequency: 'several_per_week',
    timeEstimateMinutes: 5,
  }),
  H({
    id: 'hub-growth-mindset-script',
    name: 'Stress-is-enhancing reframe',
    description:
      'Why: Huberman discusses stress mindset: brief reappraisal (“this stress can enhance me”) changes physiology versus pure threat framing.',
    how: '1) When stress hits, name it out loud or on paper.\n2) Add: “This can sharpen me for X.”\n3) Take one action aligned with that frame.\n4) Avoid toxic positivity—acknowledge difficulty first.',
    category: 'career',
    secondaryTags: ['stress', 'mindset'],
    difficulty: { time: 1, willpower: 4, energy: 2 },
    effect: { shortTerm: 5, longTerm: 7, identity: 7 },
    med: 'One reframe on a real stressor',
    highIntensity: 'Journaled reframe + action step',
    frequency: 'daily',
    timeEstimateMinutes: 3,
  }),
  H({
    id: 'hub-gratitude-specific',
    name: 'Specific gratitude (story form)',
    description:
      'Why: Huberman notes story-based, specific gratitude (not generic lists) can shift autonomic state and social neuromodulators.',
    how: '1) Recall a specific person/event that helped you.\n2) Write 5–8 sentences of the story and how it felt.\n3) Optionally thank them.\n4) Prefer depth over a long shallow list.',
    category: 'social',
    secondaryTags: ['gratitude', 'mood'],
    difficulty: { time: 3, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 6, identity: 5 },
    med: 'One specific gratitude paragraph',
    highIntensity: 'Full story + message of thanks',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),

  // ── Vision ─────────────────────────────────────────────────
  H({
    id: 'hub-near-far-focus',
    name: 'Near–far focus drills',
    description:
      'Why: Huberman’s vision toolkit includes accommodation practice—shifting focus near to far to train flexible focusing.',
    how: '1) Hold a thumb or pen at mid-distance; focus 5 s.\n2) Shift to a far target 5 s.\n3) Repeat 10–20 cycles.\n4) Relax eyes after; blink fully.',
    category: 'health',
    secondaryTags: ['vision'],
    difficulty: { time: 2, willpower: 2, energy: 2 },
    effect: { shortTerm: 4, longTerm: 6, identity: 3 },
    med: '10 near–far cycles',
    highIntensity: '20 cycles + outdoor far focus',
    frequency: 'daily',
    timeEstimateMinutes: 5,
  }),
  H({
    id: 'hub-smooth-pursuit',
    name: 'Smooth pursuit eye tracking',
    description:
      'Why: Smooth pursuit exercises appear in Huberman vision protocols to train coordinated eye movements.',
    how: '1) Slowly move a thumb left–right and up–down at arm’s length.\n2) Eyes track without jumping; head mostly still.\n3) 1–2 minutes.\n4) Stop if strain; blink and rest.',
    category: 'health',
    secondaryTags: ['vision'],
    difficulty: { time: 2, willpower: 2, energy: 2 },
    effect: { shortTerm: 3, longTerm: 5, identity: 3 },
    med: '1 minute smooth pursuit',
    highIntensity: '2–3 minutes multi-direction',
    frequency: 'several_per_week',
    timeEstimateMinutes: 3,
  }),
  H({
    id: 'hub-outdoor-no-sunglasses-am',
    name: 'Morning light without sunglasses',
    description:
      'Why: For circadian setting, Huberman generally recommends outdoor light to the eyes without sunglasses (when safe) in the morning protocol.',
    how: '1) Morning outdoor light session.\n2) Skip sunglasses unless medically required or unsafe glare.\n3) Never stare at the sun.\n4) Use hat for comfort if needed while still getting outdoor lux.',
    category: 'health',
    secondaryTags: ['vision', 'circadian'],
    difficulty: { time: 2, willpower: 2, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 4 },
    med: '5+ minutes outdoor eyes without sunglasses',
    highIntensity: 'Full morning light walk unsunglassed when safe',
    frequency: 'daily',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'hub-blink-complete',
    name: 'Complete blink breaks',
    description:
      'Why: Screen work reduces blink quality; Huberman vision hygiene includes deliberate full blinks to keep eyes comfortable and focused longer.',
    how: '1) Every 20 minutes of screens: 10 slow full blinks.\n2) Soften forehead and jaw.\n3) Optional 20-second far gaze after.\n4) Increase humidity/blink if dry.',
    category: 'health',
    secondaryTags: ['vision', 'desk'],
    difficulty: { time: 1, willpower: 2, energy: 1 },
    effect: { shortTerm: 4, longTerm: 5, identity: 3 },
    med: 'Hourly full-blink set',
    highIntensity: 'Every 20 minutes during deep work day',
    frequency: 'daily',
    timeEstimateMinutes: 2,
  }),
  H({
    id: 'hub-red-dim-night',
    name: 'Red/amber lamp last hours',
    description:
      'Why: Lower short-wavelength light at night protects melatonin; Huberman often suggests dim red/amber lighting late evening.',
    how: '1) Last 1–2 hours before bed: switch to lamps, prefer warm/red/amber.\n2) Kill bright overheads.\n3) Dim screens or use night modes as backup—not a full substitute for dim rooms.\n4) Bedroom dark for sleep.',
    category: 'health',
    secondaryTags: ['sleep', 'light'],
    difficulty: { time: 1, willpower: 4, energy: 1 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: 'One room switched to dim warm light',
    highIntensity: 'Full home evening red/amber protocol',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-outdoor-midday',
    name: 'Midday outdoor light dose',
    description:
      'Why: Additional daytime outdoor light reinforces circadian amplitude and mood—Huberman circadian toolkit beyond only morning light.',
    how: '1) Get outside around midday or early afternoon 5–15 minutes.\n2) Combine with walk or post-meal stroll.\n3) No need to stare at sun.\n4) Cloudy still counts—longer if dim.',
    category: 'health',
    secondaryTags: ['circadian', 'light'],
    difficulty: { time: 2, willpower: 3, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 4 },
    med: '5 minutes midday outside',
    highIntensity: '15-minute outdoor walk midday',
    frequency: 'daily',
    timeEstimateMinutes: 10,
  }),

  // ── Fitness advanced / metabolism ──────────────────────────
  H({
    id: 'hub-vo2-sprints',
    name: 'VO₂ max / sprint bout',
    description:
      'Why: Huberman’s foundational fitness includes periodic high-intensity work for VO₂ max alongside Zone 2 and strength.',
    how: '1) Fully warm up.\n2) 1–6 hard intervals (e.g. 20–60 s hard, full recover) as appropriate for your level.\n3) Stop if form or chest pain issues—medical clearance if needed.\n4) 1×/week is enough for many.',
    category: 'health',
    secondaryTags: ['fitness', 'advanced'],
    difficulty: { time: 4, willpower: 6, energy: 8 },
    effect: { shortTerm: 6, longTerm: 8, identity: 6 },
    med: '4×20–30 s hard efforts after warm-up',
    highIntensity: 'Structured VO₂ session 20–30 min total',
    frequency: 'weekly',
    timeEstimateMinutes: 25,
  }),
  H({
    id: 'hub-exercise-timing',
    name: 'Exercise timing for sleep',
    description:
      'Why: Hard training late can delay sleep for some; Huberman discusses placing intense exercise earlier when sleep is a priority.',
    how: '1) If sleep suffers, move hard sessions earlier in the day.\n2) Keep late movement easy (walk, mobility).\n3) Track sleep quality vs training time one week.\n4) Adjust based on your data, not dogma.',
    category: 'health',
    secondaryTags: ['fitness', 'sleep'],
    difficulty: { time: 1, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'No max-intensity training in last 2–3 h before bed',
    highIntensity: 'All hard training finished by mid-afternoon',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-last-meal-timing',
    name: 'Last meal buffer before bed',
    description:
      'Why: Huberman often suggests finishing large meals ~2–3 hours before sleep for sleep quality and metabolism (individual variation applies).',
    how: '1) Set a kitchen cutoff time aligned to bedtime.\n2) Prefer smaller earlier dinner if reflux/sleep issues.\n3) Hydrate earlier; sip only late if needed.\n4) Flexibility for social life—optimize most nights.',
    category: 'health',
    secondaryTags: ['metabolism', 'sleep'],
    difficulty: { time: 1, willpower: 5, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 5 },
    med: 'Finish main meal ≥2 h before bed most nights',
    highIntensity: 'Strict 3 h buffer + earlier digestion walk',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-protein-early',
    name: 'Protein-forward first meal',
    description:
      'Why: Huberman discusses protein distribution and daytime eating patterns supporting muscle and satiety—practical first-meal structure.',
    how: '1) Include a clear protein source in first real meal.\n2) Pair with whole foods; don’t only liquid sugar.\n3) Eat after morning light when possible.\n4) Note energy/cravings until lunch.',
    category: 'health',
    secondaryTags: ['metabolism', 'nutrition'],
    difficulty: { time: 3, willpower: 3, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 4 },
    med: 'Protein in first meal',
    highIntensity: 'Planned high-protein breakfast within eating window',
    frequency: 'daily',
    timeEstimateMinutes: 15,
  }),
  H({
    id: 'hub-neck-mobility',
    name: 'Neck & posture micro-set',
    description:
      'Why: Huberman has highlighted neck training/posture for resilience and desk health as part of a complete physical protocol.',
    how: '1) Gentle neck mobility through pain-free ranges.\n2) Optional light isometric holds if trained for it.\n3) Open chest after screens.\n4) 3–5 minutes; never force cervical joints.',
    category: 'health',
    secondaryTags: ['fitness', 'desk'],
    difficulty: { time: 2, willpower: 2, energy: 2 },
    effect: { shortTerm: 4, longTerm: 6, identity: 3 },
    med: '3 minutes gentle neck mobility',
    highIntensity: '5–8 minutes mobility + posture reset',
    frequency: 'daily',
    timeEstimateMinutes: 5,
  }),
  H({
    id: 'hub-heat-after-training',
    name: 'Heat after training (optional)',
    description:
      'Why: Huberman discusses sauna/heat often after training in studied patterns; optional recovery/heat-shock protein stimulus when healthy enough.',
    how: '1) After strength or cardio (not if overheating/ill).\n2) Sauna or hot bath in safe durations.\n3) Hydrate; exit if dizzy.\n4) Avoid very late heat if it impairs your sleep.',
    category: 'health',
    secondaryTags: ['fitness', 'heat', 'advanced'],
    difficulty: { time: 5, willpower: 3, energy: 4 },
    effect: { shortTerm: 5, longTerm: 7, identity: 4 },
    med: '10 minutes heat post-training',
    highIntensity: '15–20 minutes or multi-round protocol',
    frequency: 'several_per_week',
    timeEstimateMinutes: 20,
  }),

  // ── Mind / meditation ──────────────────────────────────────
  H({
    id: 'hub-focused-attention-med',
    name: 'Focused-attention meditation',
    description:
      'Why: Huberman covers meditation types; focused attention (breath/anchor) trains concentration circuits complementary to open monitoring.',
    how: '1) Sit 5–13 minutes.\n2) Anchor on breath or spot.\n3) When mind wanders, note and return—no self-attack.\n4) Same time daily if possible.',
    category: 'intelligence',
    secondaryTags: ['meditation', 'focus'],
    difficulty: { time: 3, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 8, identity: 6 },
    med: '5 minutes FA meditation',
    highIntensity: '13 minutes FA meditation',
    frequency: 'daily',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'hub-open-monitoring-med',
    name: 'Open monitoring meditation',
    description:
      'Why: Open monitoring builds awareness of thoughts/feelings without fixation—another Huberman-discussed meditation family for emotional flexibility.',
    how: '1) Sit 5–13 minutes.\n2) Observe sounds, body, thoughts arising/passing.\n3) Don’t chase or suppress.\n4) End with one breath of orientation to the room.',
    category: 'intelligence',
    secondaryTags: ['meditation'],
    difficulty: { time: 3, willpower: 4, energy: 2 },
    effect: { shortTerm: 4, longTerm: 7, identity: 6 },
    med: '5 minutes OM',
    highIntensity: '13 minutes OM',
    frequency: 'several_per_week',
    timeEstimateMinutes: 10,
  }),
  H({
    id: 'hub-self-hypnosis',
    name: 'Self-hypnosis / Reverie bout',
    description:
      'Why: Huberman has discussed clinical hypnosis and tools like self-hypnosis for focus, sleep, and habit change as a distinct state from meditation.',
    how: '1) Use a reputable self-hypnosis script or app protocol.\n2) 10–15 minutes undisturbed.\n3) Pick one target (sleep, focus, calm).\n4) Don’t drive/operate machinery during.',
    category: 'intelligence',
    secondaryTags: ['hypnosis', 'advanced'],
    difficulty: { time: 3, willpower: 3, energy: 2 },
    effect: { shortTerm: 5, longTerm: 7, identity: 5 },
    med: '10-minute session',
    highIntensity: '15–20 minutes targeted self-hypnosis',
    frequency: 'several_per_week',
    timeEstimateMinutes: 12,
  }),
  H({
    id: 'hub-accountability-tell',
    name: 'Accountability declaration',
    description:
      'Why: Huberman notes social accountability can increase follow-through on focus and goals via externalized commitment.',
    how: '1) Tell a specific person your next hard block or habit target.\n2) Include when you’ll report back.\n3) Keep the ask small and concrete.\n4) Close the loop with a result message.',
    category: 'social',
    secondaryTags: ['focus', 'accountability'],
    difficulty: { time: 2, willpower: 4, energy: 2 },
    effect: { shortTerm: 5, longTerm: 6, identity: 5 },
    med: 'One accountability text',
    highIntensity: 'Live check-in + scheduled debrief',
    frequency: 'several_per_week',
    timeEstimateMinutes: 5,
  }),
  H({
    id: 'hub-caffeine-cutoff',
    name: 'Caffeine cutoff 8–10 h before bed',
    description:
      'Why: Sleep toolkit staple from Huberman: stop caffeine ~8–10 hours before target sleep to protect sleep architecture.',
    how: '1) Back-calculate cutoff from bedtime.\n2) Switch to non-caffeinated options after.\n3) Watch hidden caffeine (tea, soda, preworkout).\n4) If sensitive, extend buffer.',
    category: 'health',
    secondaryTags: ['sleep', 'caffeine'],
    difficulty: { time: 1, willpower: 5, energy: 2 },
    effect: { shortTerm: 5, longTerm: 8, identity: 6 },
    med: 'No caffeine in final 8 h',
    highIntensity: '10 h cutoff + no hidden sources',
    frequency: 'daily',
    timeEstimateMinutes: 0,
  }),
  H({
    id: 'hub-morning-hydrate',
    name: 'Morning hydrate (electrolytes optional)',
    description:
      'Why: Huberman often mentions hydrating on waking (sometimes with electrolytes) to support alertness and replace overnight fluid loss.',
    how: '1) On waking, drink a full glass of water before caffeine.\n2) Optional pinch of electrolytes if you sweat/caffeine heavily—don’t overdo salt if contraindicated.\n3) Pair with morning light.\n4) Continue steady hydration daytime.',
    category: 'health',
    secondaryTags: ['metabolism'],
    difficulty: { time: 1, willpower: 2, energy: 1 },
    effect: { shortTerm: 4, longTerm: 5, identity: 3 },
    med: 'One full glass on waking',
    highIntensity: 'Water + electrolytes + no caffeine until hydrated',
    frequency: 'daily',
    timeEstimateMinutes: 3,
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
    id: 'huberman-learning-basic',
    name: 'Huberman Learning · Basic',
    description:
      'Core learning stack: ultradian block, retrieval, teach-back, space, rest after learn, sleep after hard learning.',
    habitIds: [
      'hub-ultradian-learn',
      'hub-retrieval-practice',
      'hub-teach-back',
      'hub-space-repetitions',
      'hub-learn-then-rest',
      'hub-sleep-after-learn',
    ],
  },
  {
    id: 'huberman-learning-advanced',
    name: 'Huberman Learning · Advanced',
    description:
      'Deeper plasticity tools: errors, interleaving, generation, handwriting, visual spotlight, focus bout.',
    habitIds: [
      'hub-error-learning',
      'hub-interleave-practice',
      'hub-generation-effect',
      'hub-handwrite-notes',
      'hub-visual-focus-spotlight',
      'hub-focus-ultradian',
    ],
  },
  {
    id: 'huberman-creativity',
    name: 'Huberman Creativity',
    description:
      'Create before dopamine, undistracted walks, play, novelty, single-context blocks, NSDR for insight.',
    habitIds: [
      'hub-morning-create-first',
      'hub-default-mode-walk',
      'hub-play-without-goal',
      'hub-novelty-input',
      'hub-limit-context-switch',
      'hub-nsdr-for-insight',
    ],
  },
  {
    id: 'huberman-breath-basic',
    name: 'Huberman Breath · Basic',
    description:
      'Daily breath tools: physiological sigh practice, cyclic sighing, long exhale, box, nasal default, pre-sleep sighs.',
    habitIds: [
      'hub-physiological-sigh',
      'hub-scripted-breathing',
      'hub-long-exhale',
      'hub-box-breathing',
      'hub-nasal-default',
      'hub-pre-sleep-breath',
    ],
  },
  {
    id: 'huberman-breath-advanced',
    name: 'Huberman Breath · Advanced',
    description:
      'Spike-response sighs, CO₂ walk, cautious cyclic hyperventilation, cold, NSDR, stress reframe.',
    habitIds: [
      'hub-physiological-sigh-stack',
      'hub-co2-tolerance',
      'hub-cyclic-hyperventilation-caution',
      'hub-cold-exposure',
      'hub-nsdr',
      'hub-growth-mindset-script',
    ],
  },
  {
    id: 'huberman-dopamine',
    name: 'Huberman Dopamine & Drive',
    description:
      'Baseline and motivation: low-dopamine morning, effort→reward, intermittent reward, phone delay, cold, gratitude story.',
    habitIds: [
      'hub-dopamine-fast-window',
      'hub-effort-then-reward',
      'hub-intermittent-reward',
      'hub-phone-morning',
      'hub-cold-for-dopamine',
      'hub-gratitude-specific',
    ],
  },
  {
    id: 'huberman-vision',
    name: 'Huberman Vision',
    description:
      'Eyes and light: morning light, distance breaks, near–far, smooth pursuit, blinks, midday outdoor.',
    habitIds: [
      'hub-morning-sunlight',
      'hub-view-distance',
      'hub-near-far-focus',
      'hub-smooth-pursuit',
      'hub-blink-complete',
      'hub-outdoor-midday',
    ],
  },
  {
    id: 'huberman-sleep-advanced',
    name: 'Huberman Sleep · Advanced',
    description:
      'Beyond basics: caffeine cutoff, red/amber night, last-meal buffer, pre-sleep breath, exercise timing, consistency.',
    habitIds: [
      'hub-caffeine-cutoff',
      'hub-red-dim-night',
      'hub-last-meal-timing',
      'hub-pre-sleep-breath',
      'hub-exercise-timing',
      'hub-sleep-consistency',
    ],
  },
  {
    id: 'huberman-fitness-advanced',
    name: 'Huberman Fitness · Advanced',
    description:
      'Layer on foundations: sprints/VO₂, heat after train, neck/posture, Zone 2, strength, exercise timing.',
    habitIds: [
      'hub-vo2-sprints',
      'hub-heat-after-training',
      'hub-neck-mobility',
      'hub-zone2',
      'hub-resistance',
      'hub-exercise-timing',
    ],
  },
  {
    id: 'huberman-metabolism',
    name: 'Huberman Metabolism & Meals',
    description:
      'Daytime structure: morning hydrate, protein-forward meal, post-meal walk, meal buffer, midday light, Zone 2.',
    habitIds: [
      'hub-morning-hydrate',
      'hub-protein-early',
      'hub-post-meal-walk',
      'hub-last-meal-timing',
      'hub-outdoor-midday',
      'hub-zone2',
    ],
  },
  {
    id: 'huberman-mind-meditation',
    name: 'Huberman Mind & Meditation',
    description:
      'Attention training: FA meditation, open monitoring, NSDR, self-hypnosis, visual spotlight, accountability.',
    habitIds: [
      'hub-focused-attention-med',
      'hub-open-monitoring-med',
      'hub-nsdr',
      'hub-self-hypnosis',
      'hub-visual-focus-spotlight',
      'hub-accountability-tell',
    ],
  },
  {
    id: 'huberman-light-circadian',
    name: 'Huberman Light & Circadian',
    description:
      'Light levers only: morning outdoor, no sunglasses AM, midday dose, evening dim, red/amber night, sleep schedule.',
    habitIds: [
      'hub-morning-sunlight',
      'hub-outdoor-no-sunglasses-am',
      'hub-outdoor-midday',
      'hub-evening-dim',
      'hub-red-dim-night',
      'hub-sleep-consistency',
    ],
  },
]

let addedP = 0
for (const p of newPacks) {
  // verify all habit ids exist
  const missing = p.habitIds.filter((id) => !have.has(id))
  if (missing.length) {
    console.error('Pack', p.id, 'missing habits', missing)
    process.exit(1)
  }
  if (p.habitIds.length !== 6) {
    console.error('Pack', p.id, 'not 6 habits')
    process.exit(1)
  }
  if (packHave.has(p.id)) {
    // update in place
    const idx = packs.findIndex((x) => x.id === p.id)
    packs[idx] = p
  } else {
    packs.push(p)
    packHave.add(p.id)
    addedP++
  }
}

writeFileSync(habitsPath, JSON.stringify(habits, null, 2) + '\n')
writeFileSync(packsPath, JSON.stringify(packs, null, 2) + '\n')
console.log(
  `habits total ${habits.length} (+${addedH}); packs total ${packs.length} (+${addedP} new huberman packs)`,
)
