// Confidence in a rank, radar-3.
//
// Implied value is a model; confidence is a second opinion on the model. It asks how much of the
// snapshot actually stands behind one row: is the protocol's record complete, is it big enough
// to be watched, has it been tracked long enough to trust, and does its weekly move look like a
// real trend or a data quirk? The score runs 0 to 100 and never moves the rank: a low-confidence
// row can still top the board, and the band says how much weight a reader should put on the
// number. No row can reach 100: the top of the scale is deliberately out of reach.
//
// The score is a sum of small, named parts, each tied to one field the snapshot carries, so a
// reader can see exactly what earned or cost the points. Nothing here reads a name: the same
// arithmetic judges every row.

/** The fields confidence reads: the protocol's own record plus the age the model computed. */
export interface ConfidenceInput {
  change_7d: number | null;
  listed_at: string | null;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  age_days: number | null;
}

/** The three bands the dashboard shows. */
export type ConfidenceBand = 'High' | 'Medium' | 'Low';

/** One part of a score: what it is for, and how many points it gave or cost. */
export interface SignalPart {
  label: string;
  points: number;
}

/** One row's confidence: a score, its band, the reasons that moved it most, and the parts. */
export interface ConfidenceVerdict {
  score: number;
  band: ConfidenceBand;
  reasons: string[];
  breakdown: SignalPart[];
}

/** A reason with a weight: the strongest reasons are the ones the drawer shows. */
interface ReasonNote {
  text: string;
  weight: number;
}

/** The cuts between bands. */
const HIGH_CUT = 75;
const MEDIUM_CUT = 55;

/** The floor every rankable row starts from: the snapshot vouches for its own record. */
const STARTING_POINTS = 30;

/** Points for a reported weekly move, and for a listed date. */
const MOVE_REPORTED_POINTS = 12;
const LISTED_DATE_POINTS = 10;

/** Points for a known category. */
const CATEGORY_KNOWN_POINTS = 8;

/** The penalty for a weekly move so wild it looks like a quirk, not a trend. */
const WILD_MOVE_PENALTY = 12;
const WILD_MOVE_HIGH = 300;
const WILD_MOVE_LOW = -80;

/** Points for having a listing date on file, with a note when there is none. */
function listedDatePoints(listedAt: string | null, notes: ReasonNote[]): number {
  if (listedAt === null) {
    notes.push({ text: 'no listing date on record, so the start of the record is unknown', weight: 2 });
    return 0;
  }
  return LISTED_DATE_POINTS;
}

/** Points for how long the protocol has been tracked, and a note when it is very young or old. */
function ageSpanPoints(ageDays: number | null, notes: ReasonNote[]): number {
  if (ageDays === null) return 0;
  if (ageDays >= 730) {
    notes.push({ text: 'tracked for more than two years', weight: 3 });
    return 12;
  }
  if (ageDays >= 365) {
    notes.push({ text: 'tracked for more than a year', weight: 2 });
    return 9;
  }
  if (ageDays >= 180) return 6;
  if (ageDays >= 90) return 3;
  notes.push({ text: 'listed only recently, so the track record is short', weight: 2 });
  return 0;
}

/** Points for a named category, with a note when the snapshot names none. */
function categoryPoints(category: string | null, notes: ReasonNote[]): number {
  if (category === null) {
    notes.push({ text: 'no category on record, so the kind of protocol is unclear', weight: 2 });
    return 0;
  }
  return CATEGORY_KNOWN_POINTS;
}

/** Points for how many chains the protocol runs on. */
function chainReachPoints(chains: string[], notes: ReasonNote[]): number {
  const count = chains.length;
  if (count >= 4) {
    notes.push({ text: 'live on four or more chains', weight: 1 });
    return 8;
  }
  if (count === 3) return 6;
  if (count === 2) return 4;
  if (count === 1) {
    notes.push({ text: 'live on a single chain only', weight: 1 });
    return 2;
  }
  notes.push({ text: 'no chain listed, so where it runs is unclear', weight: 1 });
  return 0;
}

/** Points for the size of the TVL: bigger totals are watched by more eyes. */
function tvlScalePoints(tvl: number, notes: ReasonNote[]): number {
  if (tvl >= 1_000_000_000) {
    notes.push({ text: 'more than $1B of TVL, watched by many eyes', weight: 3 });
    return 10;
  }
  if (tvl >= 250_000_000) return 7;
  if (tvl >= 50_000_000) return 4;
  notes.push({ text: 'small TVL, so the figures are thinly watched', weight: 2 });
  return 2;
}

/** Points for the weekly move: reported counts, an extreme one costs points. */
function movePoints(change: number | null, notes: ReasonNote[]): number {
  if (change === null) {
    notes.push({ text: 'no seven-day move reported, so momentum is unmeasured', weight: 3 });
    return 0;
  }
  if (change > WILD_MOVE_HIGH || change < WILD_MOVE_LOW) {
    notes.push({ text: 'the weekly move is extreme, so treat the figure with care', weight: 4 });
    return -WILD_MOVE_PENALTY;
  }
  return MOVE_REPORTED_POINTS;
}

/** The band a score falls in. */
function bandForScore(score: number): ConfidenceBand {
  if (score >= HIGH_CUT) return 'High';
  if (score >= MEDIUM_CUT) return 'Medium';
  return 'Low';
}

/** Clamp a score to the 0..100 scale. */
function clampScore(score: number): number {
  if (score < 0) return 0;
  if (score > 100) return 100;
  return score;
}

/**
 * One protocol's confidence: the parts summed, clamped to 0..100, banded, and the three
 * strongest reasons kept, with the full breakdown so the drawer can show the arithmetic.
 * The score never changes the rank; it says how far to trust it.
 */
export function confidenceFor(input: ConfidenceInput): ConfidenceVerdict {
  const notes: ReasonNote[] = [];
  const parts: SignalPart[] = [];
  let total = STARTING_POINTS;
  parts.push({ label: 'Snapshot record', points: STARTING_POINTS });
  const move = movePoints(input.change_7d, notes);
  total += move;
  parts.push({ label: 'Weekly move', points: move });
  const listed = listedDatePoints(input.listed_at, notes);
  total += listed;
  parts.push({ label: 'Listing date on file', points: listed });
  const span = ageSpanPoints(input.age_days, notes);
  total += span;
  parts.push({ label: 'Track record length', points: span });
  const named = categoryPoints(input.category, notes);
  total += named;
  parts.push({ label: 'Category named', points: named });
  const reach = chainReachPoints(input.chains, notes);
  total += reach;
  parts.push({ label: 'Chain reach', points: reach });
  const scale = tvlScalePoints(input.tvl_usd, notes);
  total += scale;
  parts.push({ label: 'TVL scale', points: scale });
  if (notes.length === 0) {
    notes.push({ text: 'every field the snapshot carries is present and steady', weight: 1 });
  }
  const strongest = notes
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((n) => n.text);
  const score = clampScore(total);
  return { score, band: bandForScore(score), reasons: strongest, breakdown: parts };
}
