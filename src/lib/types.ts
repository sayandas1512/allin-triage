export type CriterionId =
  | "founder_market"
  | "risk_ownership"
  | "metric_fluency"
  | "path_to_market"
  | "capital_fit"
  | "defensibility"
  | "thesis_fit";

export type Lens = "revealed" | "stated";

/** Where a claim came from. Every scored claim must carry one. */
export type SourceKind = "deck" | "form" | "web" | "memo" | "notes" | "derived";

export interface SourceRef {
  kind: SourceKind;
  /** Human readable locator, e.g. "Deck · slide 5" or "Form · Customers" */
  ref: string;
  url?: string;
}

/**
 * How far the claim can be trusted.
 * claimed      – founder's own words, not checked against anything
 * consistent   – same figure appears in deck and form, or arithmetic checks out
 * contradicted – deck and form (or arithmetic) disagree
 * external     – confirmed or contextualised by a public source
 * unverifiable – we tried and could not check it
 */
export type Verification = "claimed" | "consistent" | "contradicted" | "external" | "unverifiable";

export interface Evidence {
  claim: string;
  source: SourceRef[];
  verification: Verification;
}

export interface CriterionAssessment {
  criterion: CriterionId;
  /** 0–10, or null when nothing could be found (engine imputes a drag) */
  score: number | null;
  /** Separate score for thesis_fit under the stated lens */
  statedScore?: number;
  rationale: string;
  evidence: Evidence[];
}

export type Severity = "critical" | "high" | "medium" | "info";

export interface Flag {
  severity: Severity;
  title: string;
  detail: string;
  source: SourceRef[];
}

export interface Gap {
  what: string;
  tried: string;
  cost: string;
}

export type GateKind = "portfolio_conflict" | "stage_mandate" | "anti_thesis" | "sector_outside";

export interface Gate {
  kind: GateKind;
  hard: boolean;
  title: string;
  detail: string;
  source: SourceRef[];
}

export type Sector = "Fintech" | "Deeptech" | "Consumer tech" | "Consumer brands" | "B2B SaaS" | "Healthcare" | "Travel";

export interface Application {
  id: string;
  name: string;
  oneLiner: string;
  city: string;
  sectorSelected: string;
  sectorActual: Sector;
  stage: string;
  raiseCr: number | null;
  postMoneyCr: number | null;
  incorporated: string;
  source: "Public form" | "Warm intro (Fund I founder)";
  founders: { name: string; role: string; background: string }[];
  headline: { label: string; value: string }[];
  tags: string[];
  assessments: CriterionAssessment[];
  flags: Flag[];
  gaps: Gap[];
  gates: Gate[];
  precedents: { memoId: string; why: string }[];
  callQuestions: string[];
  /** What would change our view – used in the pass note (HopBox practice) */
  wouldChangeView: string[];
  summary: string;
  /** Live intake only: what the web-research step found (whiteboard "Free Source / Scrape") */
  research?: { notes: string; sources: { title: string; url: string }[]; model: string };
}

export interface Memo {
  id: string;
  name: string;
  sector: Sector | "Web3";
  stage: string;
  source: string;
  decision: "INVESTED" | "PASSED";
  what: string;
  reason: string;
  tags: string[];
  scores: Record<Exclude<CriterionId, "thesis_fit">, number> & { thesis_fit: number; thesis_fit_stated: number };
  gates?: GateKind[];
}

export type Recommendation = "take_call" | "partner_review" | "lean_pass" | "hold_conflict" | "out_of_mandate";

export interface Correction {
  id: string;
  appId: string;
  appName: string;
  criterion: CriterionId;
  from: number;
  to: number;
  reason: string;
  author: "Kushal" | "Aditya" | "Riya";
  tags: string[];
  createdAt: string;
  /** "similar" = generalise to companies sharing tags; "this" = one-off */
  scope: "similar" | "this";
}

export type DecisionState = "pending" | "call_approved" | "pass_confirmed" | "hold";
