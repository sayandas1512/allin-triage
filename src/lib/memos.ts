import type { Memo } from "./types";

/**
 * The twelve past deal memos, re-scored blind to the decision on the same seven criteria.
 * Scores are taken from what the memo says the fund knew about the company and founders
 * at decision time. Caveat (shown in the backtest): memo text is written after the decision,
 * so it carries the partners' reasoning. That makes this an upper bound on agreement.
 */
export const MEMOS: Memo[] = [
  {
    id: "eplane", name: "The ePlane Company", sector: "Deeptech", stage: "Early round", source: "Warm intro, Fund I network", decision: "INVESTED",
    what: "eVTOL aircraft and UAVs for intracity travel; IIT Madras incubated.",
    reason: "Underwrote two founders who stayed with a hard problem and answered 'what would make you quit?' with a technical milestone. Cheque sized for a slow regulatory path.",
    tags: ["deeptech", "hardware", "aerospace", "regulated"],
    scores: { founder_market: 9, risk_ownership: 8, metric_fluency: 4, path_to_market: 5, capital_fit: 5, defensibility: 8, thesis_fit: 7, thesis_fit_stated: 9 },
  },
  {
    id: "petalry", name: "Petalry", sector: "Consumer brands", stage: "Pre-seed", source: "Public form", decision: "PASSED",
    what: "D2C skincare; ~18 months old, thousands of monthly orders, Instagram-led.",
    reason: "Growth bought not earned (2/3 paid social); founder could not give a repeat rate and did not think in cohorts.",
    tags: ["consumer-brand", "d2c", "beauty", "single-manufacturer"],
    scores: { founder_market: 5, risk_ownership: 4, metric_fluency: 2, path_to_market: 5, capital_fit: 6, defensibility: 3, thesis_fit: 6, thesis_fit_stated: 8 },
  },
  {
    id: "unbox", name: "Unbox Robotics", sector: "Deeptech", stage: "Early round", source: "Warm intro, co-investor", decision: "INVESTED",
    what: "Compact AI-assisted parcel-sorting robots for warehouses.",
    reason: "Deeptech with a near path to revenue; product in live sites; founders described pilot failures before being asked.",
    tags: ["deeptech", "hardware", "robotics", "b2b", "pilots"],
    scores: { founder_market: 9, risk_ownership: 9, metric_fluency: 6, path_to_market: 7, capital_fit: 6, defensibility: 6, thesis_fit: 8, thesis_fit_stated: 9 },
  },
  {
    id: "hopbox", name: "HopBox", sector: "Consumer tech", stage: "Pre-seed", source: "Warm intro", decision: "PASSED",
    what: "10-minute grocery delivery from dark stores in one neighbourhood cluster.",
    reason: "Good operators, wrong game for pre-seed: only works with far more capital than the fund deploys. Pass on structure, not people.",
    tags: ["consumer-tech", "quick-commerce", "capital-intensive"],
    scores: { founder_market: 7, risk_ownership: 4, metric_fluency: 6, path_to_market: 5, capital_fit: 1, defensibility: 2, thesis_fit: 3, thesis_fit_stated: 7 },
    gates: ["anti_thesis"],
  },
  {
    id: "wint", name: "Wint Wealth", sector: "Fintech", stage: "Early round", source: "Founder referral", decision: "INVESTED",
    what: "Retail access to bonds; run almost manually at first.",
    reason: "Founder did unscalable things in the right order and understood trust, not tech, was the bottleneck.",
    tags: ["fintech", "wealth", "manual-first", "regulated"],
    scores: { founder_market: 9, risk_ownership: 8, metric_fluency: 4, path_to_market: 6, capital_fit: 7, defensibility: 6, thesis_fit: 8, thesis_fit_stated: 7 },
  },
  {
    id: "campuscredit", name: "CampusCredit", sector: "Fintech", stage: "Pre-seed", source: "Public form", decision: "PASSED",
    what: "BNPL and small-ticket credit for students via an NBFC partner.",
    reason: "Founder said default rates were 'something the NBFC partner handles' — a lending founder who doesn't own risk.",
    tags: ["fintech", "lending", "nbfc-partner", "consumer-credit"],
    scores: { founder_market: 4, risk_ownership: 1, metric_fluency: 3, path_to_market: 6, capital_fit: 6, defensibility: 3, thesis_fit: 4, thesis_fit_stated: 8 },
  },
  {
    id: "giva", name: "GIVA", sector: "Consumer brands", stage: "Early round", source: "Public form", decision: "INVESTED",
    what: "Online-first fine silver jewellery brand.",
    reason: "Founder knew cohort repeat, CAC by channel and gross margin without notes. Passed the repeat-rate test D2C usually fails.",
    tags: ["consumer-brand", "d2c", "jewellery", "cohorts"],
    scores: { founder_market: 8, risk_ownership: 7, metric_fluency: 9, path_to_market: 7, capital_fit: 6, defensibility: 6, thesis_fit: 9, thesis_fit_stated: 9 },
  },
  {
    id: "aerodrop", name: "AeroDrop", sector: "Deeptech", stage: "Pre-seed", source: "Warm intro", decision: "PASSED",
    what: "Autonomous medical drone delivery; prototype and demo flights.",
    reason: "No customer, no regulator path, no answer on liability — and the founder treated all three as 'solved once the tech works'.",
    tags: ["deeptech", "hardware", "drones", "regulated"],
    scores: { founder_market: 7, risk_ownership: 2, metric_fluency: 3, path_to_market: 1, capital_fit: 4, defensibility: 6, thesis_fit: 5, thesis_fit_stated: 9 },
  },
  {
    id: "superk", name: "SuperK", sector: "Consumer tech", stage: "Early round", source: "Warm intro, Fund I founder", decision: "INVESTED",
    what: "Tech-enabled small-town grocery network rebranding neighbourhood stores.",
    reason: "Founders spent months in small-town stores and knew owners wanted working capital and price support, not 'technology'.",
    tags: ["small-town", "retail", "commerce-infra", "kirana", "field-first"],
    scores: { founder_market: 9, risk_ownership: 7, metric_fluency: 4, path_to_market: 7, capital_fit: 6, defensibility: 7, thesis_fit: 9, thesis_fit_stated: 5 },
  },
  {
    id: "coinlane", name: "Coinlane", sector: "Web3", stage: "Pre-seed", source: "Public form", decision: "PASSED",
    what: "Retail crypto exchange and wallet with fiat on-ramp.",
    reason: "Category decision: a business whose existence depends on friendlier regulation is not one to underwrite at pre-seed.",
    tags: ["web3", "regulatory-dependent", "payments-partner"],
    scores: { founder_market: 6, risk_ownership: 3, metric_fluency: 5, path_to_market: 6, capital_fit: 6, defensibility: 3, thesis_fit: 1, thesis_fit_stated: 4 },
    gates: ["anti_thesis"],
  },
  {
    id: "jaikisan", name: "Jai Kisan", sector: "Fintech", stage: "Early round", source: "Warm intro", decision: "INVESTED",
    what: "Financing for farmers' income-generating purchases via channel partners.",
    reason: "Founders built distribution and registered farmers before lending; discussion centred on building credit-risk depth. They owned the risk.",
    tags: ["fintech", "lending", "rural", "field-first"],
    scores: { founder_market: 9, risk_ownership: 7, metric_fluency: 5, path_to_market: 7, capital_fit: 6, defensibility: 6, thesis_fit: 8, thesis_fit_stated: 5 },
  },
  {
    id: "prepnest", name: "Prepnest", sector: "Consumer tech", stage: "Pre-seed", source: "Warm intro", decision: "PASSED",
    what: "Mobile test-prep app led by a popular teacher; strong downloads.",
    reason: "The product is the teacher; no 30/90-day retention; founder defensive on copycat risk.",
    tags: ["consumer-tech", "edtech", "creator-led"],
    scores: { founder_market: 6, risk_ownership: 3, metric_fluency: 2, path_to_market: 6, capital_fit: 7, defensibility: 3, thesis_fit: 5, thesis_fit_stated: 7 },
  },
];

export const MEMO = Object.fromEntries(MEMOS.map((m) => [m.id, m])) as Record<string, Memo>;
