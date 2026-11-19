import { CRITERIA } from "./thesis";
import { DEFAULT_RUBRIC, weightsOf, type Rubric } from "./rubric";
import type {
  Application,
  Correction,
  CriterionId,
  Gate,
  GateKind,
  Lens,
  Memo,
  Recommendation,
  Verification,
} from "./types";

export const REC_COPY: Record<Recommendation, { label: string; tone: string; short: string }> = {
  take_call: { label: "Take the call", tone: "go", short: "Call" },
  partner_review: { label: "Partner review", tone: "review", short: "Review" },
  lean_pass: { label: "Lean pass", tone: "pass", short: "Pass" },
  hold_conflict: { label: "Hold — conflict check", tone: "hold", short: "Hold" },
  out_of_mandate: { label: "Out of mandate", tone: "mandate", short: "Mandate" },
};

export interface Adjustment {
  correctionId: string;
  fromApp: string;
  delta: number;
  similarity: number;
  reason: string;
  author: string;
}

export interface CriterionResult {
  criterion: CriterionId;
  raw: number | null;
  base: number;
  imputed: boolean;
  adjustments: Adjustment[];
  final: number;
  weight: number;
  contribution: number;
}

export interface ScoreResult {
  lens: Lens;
  composite: number;
  criteria: CriterionResult[];
  recommendation: Recommendation;
  why: string[];
  confidence: number;
  confidenceLabel: "High" | "Medium" | "Low";
  evidenceCounts: Record<Verification, number>;
}

const clamp = (n: number, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

export function jaccard(a: string[], b: string[]) {
  const A = new Set(a);
  const B = new Set(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  const uni = new Set([...A, ...B]).size;
  return uni === 0 ? 0 : inter / uni;
}

/** How a stored correction transfers to another company. Shown, never hidden. */
export function adjustmentsFor(
  target: { id: string; tags: string[] },
  criterion: CriterionId,
  corrections: Correction[],
): Adjustment[] {
  const out: Adjustment[] = [];
  for (const c of corrections) {
    if (c.criterion !== criterion) continue;
    let sim: number;
    if (c.appId === target.id) sim = 1;
    else if (c.scope === "this" || c.tags.length === 0) continue;
    else sim = c.tags.filter((t) => target.tags.includes(t)).length / c.tags.length;
    // The corrector chose which tags the lesson generalises to; at least half must match.
    if (sim < 0.5) continue;
    const delta = round1((c.to - c.from) * sim);
    if (delta === 0) continue;
    out.push({ correctionId: c.id, fromApp: c.appName, delta, similarity: sim, reason: c.reason, author: c.author });
  }
  return out;
}

interface Scorable {
  id: string;
  tags: string[];
  scoreOf: (c: CriterionId, lens: Lens) => number | null;
  gates: { kind: GateKind; hard: boolean; title: string }[];
  verification: Verification[];
  gapCount: number;
}

function score(s: Scorable, lens: Lens, corrections: Correction[], dismissed: string[] = [], rubric: Rubric = DEFAULT_RUBRIC): ScoreResult {
  const w = weightsOf(rubric, lens);
  const T = rubric.thresholds;
  const criteria: CriterionResult[] = CRITERIA.map(({ id }) => {
    const raw = s.scoreOf(id, lens);
    const imputed = raw === null;
    const base = raw ?? rubric.missingDrag;
    const adjustments = adjustmentsFor(s, id, corrections).filter((a) => !dismissed.includes(a.correctionId));
    const final = round1(clamp(base + adjustments.reduce((t, a) => t + a.delta, 0)));
    return { criterion: id, raw, base, imputed, adjustments, final, weight: w[id], contribution: final * w[id] };
  });
  const composite = round1(criteria.reduce((t, c) => t + c.contribution, 0));

  const why: string[] = [];
  let recommendation: Recommendation;
  const hard = s.gates.filter((g) => g.hard);
  const conflict = hard.find((g) => g.kind === "portfolio_conflict");
  const stage = hard.find((g) => g.kind === "stage_mandate");
  const anti = hard.find((g) => g.kind === "anti_thesis");
  const get = (id: CriterionId) => criteria.find((c) => c.criterion === id)!.final;

  if (conflict) {
    recommendation = "hold_conflict";
    why.push(`Gate: ${conflict.title}. Score is shown but nothing moves until a partner clears the conflict.`);
  } else if (stage) {
    recommendation = "out_of_mandate";
    why.push(`Gate: ${stage.title}.`);
  } else if (anti) {
    recommendation = "lean_pass";
    why.push(`Gate: ${anti.title}. Category decision, not a judgement on the founders.`);
  } else if (composite >= T.takeCall) {
    recommendation = "take_call";
    why.push(`Composite ${composite} ≥ ${T.takeCall} on the ${lens} thesis.`);
  } else if (composite >= T.review) {
    recommendation = "partner_review";
    why.push(`Composite ${composite} sits between ${T.review} and ${T.takeCall}: a partner should read it.`);
  } else {
    recommendation = "lean_pass";
    why.push(`Composite ${composite} < ${T.review}.`);
  }

  // Floor rule: the two founder criteria the memos turned on cannot be averaged away.
  const floor = (["founder_market", "risk_ownership"] as CriterionId[]).filter((id) => get(id) <= 2);
  if (recommendation === "take_call" && floor.length) {
    recommendation = "partner_review";
    why.push(`Floor rule: ${floor.join(", ")} ≤ 2 — a high average cannot carry a founder who fails this.`);
  }
  const soft = s.gates.filter((g) => !g.hard);
  if (recommendation === "take_call" && soft.length) {
    recommendation = "partner_review";
    why.push(`Soft gate caps this at partner review: stretching the thesis is a partner's call, not the system's.`);
  }
  const imputed = criteria.filter((c) => c.imputed);
  if (imputed.length) why.push(`${imputed.length} criterion(s) had no evidence and were scored at ${rubric.missingDrag} (missing data drags).`);
  for (const g of s.gates.filter((g) => !g.hard)) why.push(`Soft flag: ${g.title}.`);

  const counts: Record<Verification, number> = { claimed: 0, consistent: 0, contradicted: 0, external: 0, unverifiable: 0 };
  s.verification.forEach((v) => counts[v]++);
  const n = Math.max(1, s.verification.length);
  const quality =
    (counts.external * 1 + counts.consistent * 0.9 + counts.claimed * 0.55 + counts.contradicted * 0.35 + counts.unverifiable * 0.2) / n;
  const confidence = Math.round(clamp(quality * 100 - s.gapCount * 3 - imputed.length * 6, 5, 98));
  const confidenceLabel = confidence >= 72 ? "High" : confidence >= 55 ? "Medium" : "Low";

  return { lens, composite, criteria, recommendation, why, confidence, confidenceLabel, evidenceCounts: counts };
}

export function scoreApplication(app: Application, lens: Lens, corrections: Correction[] = [], dismissed: string[] = [], rubric: Rubric = DEFAULT_RUBRIC) {
  return score(
    {
      id: app.id,
      tags: app.tags,
      scoreOf: (c, l) => {
        const a = app.assessments.find((x) => x.criterion === c);
        if (!a) return null;
        if (c === "thesis_fit" && l === "stated" && a.statedScore !== undefined) return a.statedScore;
        return a.score;
      },
      gates: app.gates,
      verification: app.assessments.flatMap((a) => a.evidence.map((e) => e.verification)),
      gapCount: app.gaps.length,
    },
    lens,
    corrections,
    dismissed,
    rubric,
  );
}

export function scoreMemo(m: Memo, lens: Lens, rubric: Rubric = DEFAULT_RUBRIC) {
  return score(
    {
      id: m.id,
      tags: m.tags,
      scoreOf: (c, l) => (c === "thesis_fit" ? (l === "stated" ? m.scores.thesis_fit_stated : m.scores.thesis_fit) : m.scores[c]),
      gates: (m.gates ?? []).map((k) => ({ kind: k, hard: true, title: k === "anti_thesis" ? "Anti-thesis category" : k })),
      verification: [],
      gapCount: 0,
    },
    lens,
    [],
    [],
    rubric,
  );
}

export type BacktestCall = "advance" | "borderline" | "pass";

export function backtest(memos: Memo[], lens: Lens, rubric: Rubric = DEFAULT_RUBRIC) {
  const rows = memos.map((m) => {
    const r = scoreMemo(m, lens, rubric);
    const call: BacktestCall = r.recommendation === "take_call" ? "advance" : r.recommendation === "partner_review" ? "borderline" : "pass";
    const agrees = (call === "advance" && m.decision === "INVESTED") || (call === "pass" && m.decision === "PASSED");
    return { memo: m, result: r, call, agrees };
  });
  const strict = rows.filter((r) => r.agrees).length;
  const borderline = rows.filter((r) => r.call === "borderline").length;
  const hardMisses = rows.filter(
    (r) => (r.call === "pass" && r.memo.decision === "INVESTED") || (r.call === "advance" && r.memo.decision === "PASSED"),
  );
  const yesRecall =
    rows.filter((r) => r.memo.decision === "INVESTED" && r.call !== "pass").length / rows.filter((r) => r.memo.decision === "INVESTED").length;
  return { rows, strict, borderline, hardMisses, total: rows.length, yesRecall };
}

export function gateFor(app: Application, kind: GateKind): Gate | undefined {
  return app.gates.find((g) => g.kind === kind);
}

/** Riya's baseline: 30 minutes per application (case brief). */
export const RIYA_MINUTES_PER_APP = 30;
/** Partner time to read a scored brief, estimated; to be measured in the shadow period. */
export const BRIEF_MINUTES_PER_APP = 6;
