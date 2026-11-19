import { CRITERIA, MISSING_DRAG, THRESHOLDS, WEIGHTS } from "./thesis";
import type { CriterionId, Lens } from "./types";

/**
 * Whiteboard box 1, "Define rubrics". Everything the engine needs to turn criterion scores into a
 * recommendation. Weights are stored as importance points and normalised at scoring time, so any
 * combination of sliders still produces a 0–10 composite.
 */
export interface Rubric {
  points: Record<Lens, Record<CriterionId, number>>;
  thresholds: { takeCall: number; review: number };
  /** score imputed for a criterion with no evidence */
  missingDrag: number;
}

export interface RubricVersion {
  id: string;
  name: string;
  note: string;
  author: "Kushal" | "Aditya" | "Riya" | "System";
  at: string;
  rubric: Rubric;
}

const toPoints = (w: Record<CriterionId, number>) =>
  Object.fromEntries(Object.entries(w).map(([k, v]) => [k, Math.round(v * 100)])) as Record<CriterionId, number>;

export const DEFAULT_RUBRIC: Rubric = {
  points: { stated: toPoints(WEIGHTS.stated), revealed: toPoints(WEIGHTS.revealed) },
  thresholds: { ...THRESHOLDS },
  missingDrag: MISSING_DRAG,
};

export const BASELINE_VERSION: RubricVersion = {
  id: "v0",
  name: "v0 · baseline",
  note: "Reconstructed from public interviews (stated) and the 12 deal memos (revealed).",
  author: "System",
  at: "2026-11-18T09:00:00+05:30",
  rubric: DEFAULT_RUBRIC,
};

export function weightsOf(r: Rubric, lens: Lens): Record<CriterionId, number> {
  const p = r.points[lens];
  const total = CRITERIA.reduce((t, c) => t + Math.max(0, p[c.id] ?? 0), 0) || 1;
  return Object.fromEntries(CRITERIA.map((c) => [c.id, Math.max(0, p[c.id] ?? 0) / total])) as Record<CriterionId, number>;
}

export function cloneRubric(r: Rubric): Rubric {
  return { points: { stated: { ...r.points.stated }, revealed: { ...r.points.revealed } }, thresholds: { ...r.thresholds }, missingDrag: r.missingDrag };
}

export function sameRubric(a: Rubric, b: Rubric) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Human-readable list of what changed between two rubrics, for the version log. */
export function diffRubric(from: Rubric, to: Rubric): string[] {
  const out: string[] = [];
  for (const lens of ["revealed", "stated"] as Lens[]) {
    const a = weightsOf(from, lens);
    const b = weightsOf(to, lens);
    for (const c of CRITERIA) {
      const d = Math.round(b[c.id] * 100) - Math.round(a[c.id] * 100);
      if (d !== 0) out.push(`${lens}: ${c.name} ${Math.round(a[c.id] * 100)}% → ${Math.round(b[c.id] * 100)}%`);
    }
  }
  if (from.thresholds.takeCall !== to.thresholds.takeCall) out.push(`call threshold ${from.thresholds.takeCall} → ${to.thresholds.takeCall}`);
  if (from.thresholds.review !== to.thresholds.review) out.push(`review threshold ${from.thresholds.review} → ${to.thresholds.review}`);
  if (from.missingDrag !== to.missingDrag) out.push(`missing-data score ${from.missingDrag} → ${to.missingDrag}`);
  return out;
}
