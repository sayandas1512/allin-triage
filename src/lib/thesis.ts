import type { CriterionId, Lens, SourceRef } from "./types";

/** Public sources used to reconstruct the thesis. Nothing here is from the fund's own files. */
export const WEB = {
  inc42FMF: {
    kind: "web",
    ref: "Inc42 · Kushal Bhagia on the founder-market-fit framework (Mar 2023)",
    url: "https://inc42.com/features/kushal-baghia-all-in-capital-founder-market-fit-framework-pre-seed-investing",
  },
  outlookFund2: {
    kind: "web",
    ref: "Outlook Business · Fund II launch, ₹200 Cr (Mar 2025)",
    url: "https://www.outlookbusiness.com/start-up/news/all-in-capital-launches-rs-200-cr-fund-to-back-indian-startups-in-fintech-deeptech-consumer-tech",
  },
  entrackrFund2: {
    kind: "web",
    ref: "Entrackr · Fund II target corpus ₹200 Cr",
    url: "https://entrackr.com/snippets/all-in-capital-launches-fund-ii-with-target-corpus-of-rs-200-cr-8872102",
  },
  isnFund2: {
    kind: "web",
    ref: "Indian Startup News · first cheques ₹2–5 Cr, ~50 companies",
    url: "https://indianstartupnews.com/funding/all-in-capital-launches-rs-200-crore-second-fund-secures-rs-85-crore-in-first-close-8872954",
  },
  viAISaaS: {
    kind: "web",
    ref: "Venture Intelligence · All In launches seed program for AI SaaS founders",
    url: "https://news.ventureintelligence.com/private-equity/all-in-capital-launches-seed-program-for-ai-saas-founders",
  },
  meetrecordRound: {
    kind: "web",
    ref: "Inc42 · MeetRecord raises $2.7M; All In Capital participates (Jun 2024)",
    url: "https://inc42.com/buzz/meetrecord-bags-2-7-mn-funding-to-enhance-ai-powered-sales-coaching-platform",
  },
  rentHalt: {
    kind: "web",
    ref: "Entrackr · CRED, PhonePe, Paytm stop rent payments via credit cards",
    url: "https://entrackr.com/news/cred-phonepe-paytm-stop-rent-payments-via-credit-cards-10474094",
  },
  rentHaltBS: {
    kind: "web",
    ref: "Business Standard · PhonePe, Paytm, CRED end rent service as RBI tightens PA rules",
    url: "https://www.business-standard.com/finance/personal-finance/phonepe-paytm-cred-end-rent-service-as-rbi-tightens-payment-rules-125091800422_1.html",
  },
  dlg: {
    kind: "web",
    ref: "AZB & Partners · RBI Default Loss Guarantee guidelines (5% cap, Jun 2023)",
    url: "https://www.azbpartners.com/bank/guidelines-on-default-loss-guarantee-dlg-digital-lending/",
  },
  jumbotail: {
    kind: "web",
    ref: "YourStory · Jumbotail raises $120M Series D, acquires Solv (Jun 2025)",
    url: "https://yourstory.com/2025/06/jumbotail-raises-120m-series-d-round-completes-solv-acquisition",
  },
  kiranaCaptable: {
    kind: "web",
    ref: "The Captable · Kirana startups: Udaan, Jumbotail, ShopKirana, Solv",
    url: "https://the-captable.com/2025/07/kirana-startups-udaan-jumbotail-shopkirana-solv",
  },
  infiniteUptime: {
    kind: "web",
    ref: "Entrackr · Infinite Uptime raises $35M Series C",
    url: "https://entrackr.com/news/infinite-uptime-raises-35-mn-in-series-c-round-8841757",
  },
  soulfull: {
    kind: "web",
    ref: "Tata Consumer · acquisition of Soulfull (millet brand)",
    url: "https://tataconsumer.com/news/tata-consumer-products-acquire-kottaram-agro-foods-owner-brand-soulfull",
  },
  ewa: {
    kind: "web",
    ref: "Outlook Business · Earned wage access in India (Refyne et al.)",
    url: "https://www.outlookbusiness.com/news/ushering-end-of-predatory-lending-with-earned-wage-access-news-192774",
  },
} satisfies Record<string, SourceRef>;

export const NOTES = (meeting: number, what: string): SourceRef => ({
  kind: "notes",
  ref: `Partner notes · Meeting ${meeting} · ${what}`,
});

export interface CriterionDef {
  id: CriterionId;
  name: string;
  short: string;
  question: string;
  definition: string;
  /** Which past decisions taught us this criterion */
  learnedFrom: string[];
  publicAnchor: string;
  sectorMetric?: Partial<Record<string, string>>;
}

export const CRITERIA: CriterionDef[] = [
  {
    id: "founder_market",
    name: "Founder–market fit",
    short: "FMF",
    question: "What do these founders know and can do that this problem needs, and did they go to the customer first?",
    definition:
      "Earned secrets from prior work, complementary skills, and evidence of time spent with the customer before the product. Credentials alone score nothing (Meeting 3: 'score the evidence, not the pedigree').",
    learnedFrom: ["superk", "wint", "jaikisan", "unbox", "eplane"],
    publicAnchor: "Inc42 (2023): FMF framework — key skills needed, key risk, founders' 'earned secrets', proven ability to build.",
  },
  {
    id: "risk_ownership",
    name: "Owns the hard risk",
    short: "Risk",
    question: "Can the founder name the risk that kills this company, and do they treat it as theirs?",
    definition:
      "Candour on the weak spot, described before being asked. Pushing the core risk onto a partner ('the NBFC handles it', 'solved once the tech works', 'the rules will get friendlier') scores low. Defensiveness is information (Meeting 1).",
    learnedFrom: ["campuscredit", "jaikisan", "aerodrop", "coinlane", "prepnest", "unbox"],
    publicAnchor: "Not stated publicly. Reconstructed from memos 6, 8, 10, 11, 12.",
  },
  {
    id: "metric_fluency",
    name: "Evidence & metric fluency",
    short: "Evidence",
    question: "Does the sector's deciding number exist, and does it hold up across deck, form and arithmetic?",
    definition:
      "Consumer brands: cohort repeat and gross margin. Lending: defaults and who funds the book. Consumer apps: 30/90-day retention. Deeptech/hardware: pilot-to-paid. A missing deciding number drags the score; it is never skipped (Meeting 1). Contradictions between deck and form drag it further.",
    learnedFrom: ["petalry", "giva", "prepnest", "hopbox"],
    publicAnchor: "Not stated publicly. Reconstructed from memos 2, 7, 12 and Meeting 1.",
    sectorMetric: {
      "Consumer brands": "Cohort repeat rate + gross margin",
      Fintech: "Defaults, loss ownership, who funds the book",
      "Consumer tech": "30/90-day retention",
      Deeptech: "Pilot-to-paid conversion",
      "B2B SaaS": "Paying logos, churn, CAC",
      Healthcare: "Unit-level P&L, repeat visits",
      Travel: "Repeat bookings, contribution per trip",
    },
  },
  {
    id: "path_to_market",
    name: "Path to market",
    short: "Market",
    question: "Is there a paying customer, a repeatable channel, and (where relevant) a path through the regulator?",
    definition:
      "Scored separately from founder quality, per Meeting 3. Deeptech needs a milestone sequence through certification (ePlane) not 'later' (AeroDrop).",
    learnedFrom: ["aerodrop", "eplane", "unbox"],
    publicAnchor: "Inc42: judge the bet by the business model at seed, 6–12 months out.",
  },
  {
    id: "capital_fit",
    name: "Fits a pre-seed cheque",
    short: "Capital",
    question: "Can a ≤ ₹5 Cr first cheque get this company to its next proof point without being the cheque that gets diluted?",
    definition:
      "Stage, round size and capital intensity. Models that only work after a large raise score low regardless of team (HopBox: 'pass on structure, not people').",
    learnedFrom: ["hopbox", "eplane"],
    publicAnchor: "Fund II: pre-seed, first cheques up to ₹5 Cr, ~50 companies over 3 years.",
  },
  {
    id: "defensibility",
    name: "Why now & right to win",
    short: "Moat",
    question: "What changed in the world that makes this possible now, and what stops a bigger player copying it?",
    definition:
      "A technology or behaviour shift plus something hard to copy: field execution, distribution, data. Founder-dependent content and 'no competitors' claims score low.",
    learnedFrom: ["prepnest", "superk", "hopbox"],
    publicAnchor: "Inc42: 'what has changed in the world' that makes the product possible now.",
  },
  {
    id: "thesis_fit",
    name: "Thesis fit",
    short: "Thesis",
    question: "Does this sit inside what the fund backs: by the written thesis (stated) or by what it has actually done (revealed)?",
    definition:
      "Stated lens: the four public sectors and pre-seed. Revealed lens: the patterns in the yeses — commerce infrastructure, consumer with real repeat, founder-owned risk in regulated categories. Businesses whose existence depends on a favourable regulatory change are anti-thesis (Coinlane).",
    learnedFrom: ["coinlane", "jaikisan", "superk", "wint"],
    publicAnchor: "Fund II focus: fintech, deeptech, consumer tech, consumer brands (Outlook Business 2025).",
  },
];

export const CRITERION = Object.fromEntries(CRITERIA.map((c) => [c.id, c])) as Record<CriterionId, CriterionDef>;

/**
 * Weights per lens. Stated mirrors the public wording (FMF + sector label).
 * Revealed mirrors what the twelve memos actually turned on.
 */
export const WEIGHTS: Record<Lens, Record<CriterionId, number>> = {
  stated: {
    founder_market: 0.25,
    risk_ownership: 0.05,
    metric_fluency: 0.1,
    path_to_market: 0.15,
    capital_fit: 0.1,
    defensibility: 0.1,
    thesis_fit: 0.25,
  },
  revealed: {
    founder_market: 0.2,
    risk_ownership: 0.2,
    metric_fluency: 0.2,
    path_to_market: 0.15,
    capital_fit: 0.1,
    defensibility: 0.1,
    thesis_fit: 0.05,
  },
};

export const THRESHOLDS = { takeCall: 6.5, review: 5.0 };

/** Score imputed when a criterion has no evidence. Meeting 1: "a missing number should drag the score, not be skipped." */
export const MISSING_DRAG = 3;

export const LENS_COPY: Record<Lens, { label: string; blurb: string }> = {
  revealed: {
    label: "Revealed thesis",
    blurb: "Weighted the way the 12 memos actually decided: founder-owned risk and the deciding metric carry as much as founder-market fit.",
  },
  stated: {
    label: "Stated thesis",
    blurb: "Weighted the way the public wording reads: founder-market fit and the four sector labels dominate.",
  },
};

export const STATED_THESIS = [
  { k: "Stage", v: "Pre-seed (some seed). Companies often pre-revenue, sometimes pre-product.", src: [WEB.inc42FMF, WEB.outlookFund2] },
  { k: "Cheque", v: "First cheques up to ₹5 Cr in Fund II (Fund I averaged ~$150K). Reported ranges disagree.", src: [WEB.isnFund2, WEB.inc42FMF] },
  { k: "Fund", v: "Fund II: ₹200 Cr target + ₹100 Cr greenshoe; ~50 companies over 3 years. Fund I ≈ $11M, ~51 companies.", src: [WEB.outlookFund2, WEB.entrackrFund2] },
  { k: "Sectors", v: "Fintech, deeptech, consumer tech, consumer brands. Earlier described as sector-agnostic.", src: [WEB.outlookFund2, WEB.inc42FMF] },
  { k: "Founders", v: "Founder-market fit: key skills, key risk, earned secrets; first-timers must show a proven ability to build; long-shared-history teams preferred.", src: [WEB.inc42FMF] },
  { k: "Timing", v: "Starts from 'what has changed in the world' — a technology or consumer-behaviour shift.", src: [WEB.inc42FMF] },
  { k: "Style", v: "Describes itself as contrarian; expects seed 6–12 months after pre-seed.", src: [WEB.inc42FMF] },
];

export const ANTI_THESIS = [
  {
    rule: "Existence depends on a favourable regulatory change",
    from: "Coinlane (memo 10): 'about the category, not the people'",
  },
  {
    rule: "Model only works after a raise far larger than a pre-seed cheque",
    from: "HopBox (memo 4): 'pass on structure, not people'",
  },
  {
    rule: "Lending where the founder does not own credit risk",
    from: "CampusCredit (memo 6) vs Jai Kisan (memo 11)",
  },
  {
    rule: "Out of stage: Series A and later",
    from: "Public mandate: pre-seed, first cheque ≤ ₹5 Cr",
  },
  {
    rule: "Direct competitor of a portfolio company, unless both founders know",
    from: "Meeting 4 (MeetRecord near-miss): default is no",
  },
];

export interface PortfolioCo {
  name: string;
  what: string;
  tags: string[];
  src: SourceRef;
}

const PORT_SRC: SourceRef = { kind: "web", ref: "Outlook Business / Inc42 portfolio mentions", url: WEB.outlookFund2.url };
const MEMO_SRC: SourceRef = { kind: "memo", ref: "Deal memo pack" };

/** Public portfolio list used for conflict checks. Incomplete by construction — see the gap it creates. */
export const PORTFOLIO: PortfolioCo[] = [
  { name: "MeetRecord", what: "AI conversation intelligence & sales coaching for B2B teams", tags: ["sales-ai", "call-recording", "b2b-saas", "crm"], src: WEB.meetrecordRound },
  { name: "Wint Wealth", what: "Retail bonds / fixed income platform", tags: ["fintech", "wealth", "fixed-income"], src: MEMO_SRC },
  { name: "SuperK", what: "Small-town grocery retail network", tags: ["small-town", "retail", "commerce-infra", "kirana"], src: MEMO_SRC },
  { name: "Jai Kisan", what: "Rural and agri credit", tags: ["lending", "rural", "fintech"], src: MEMO_SRC },
  { name: "GIVA", what: "D2C silver & fine jewellery", tags: ["d2c", "consumer-brand", "jewellery"], src: MEMO_SRC },
  { name: "Unbox Robotics", what: "Warehouse sorting robotics", tags: ["robotics", "hardware", "logistics"], src: MEMO_SRC },
  { name: "The ePlane Company", what: "eVTOL aircraft", tags: ["aerospace", "hardware", "deeptech"], src: MEMO_SRC },
  { name: "Volt Money", what: "Loans against mutual funds", tags: ["lending", "fintech", "wealth"], src: WEB.inc42FMF },
  { name: "Magma", what: "Portfolio company (Fund I)", tags: [], src: WEB.inc42FMF },
  { name: "SuprSend", what: "Notification infrastructure for developers", tags: ["b2b-saas", "devtools"], src: WEB.inc42FMF },
  { name: "CommandK", what: "Secrets management for engineering teams", tags: ["b2b-saas", "devtools", "security"], src: WEB.inc42FMF },
  { name: "Produze", what: "Portfolio company (Fund I)", tags: [], src: WEB.inc42FMF },
  { name: "PierSight Space", what: "SAR satellites for maritime monitoring", tags: ["space", "deeptech", "hardware"], src: PORT_SRC },
  { name: "MasterChow", what: "Asian sauces & cooking kits", tags: ["consumer-brand", "food", "d2c"], src: PORT_SRC },
  { name: "NewMe", what: "Fast-fashion brand for Gen Z women", tags: ["consumer-brand", "fashion", "d2c"], src: PORT_SRC },
  { name: "Vaaree", what: "Home décor marketplace", tags: ["consumer-tech", "home"], src: PORT_SRC },
  { name: "Taakat", what: "Mass-market FMCG", tags: ["consumer-brand", "fmcg", "food"], src: PORT_SRC },
  { name: "MedMitra", what: "AI co-pilot for physicians", tags: ["healthcare", "ai", "b2b-saas"], src: PORT_SRC },
  { name: "Spill Games", what: "Mobile gaming studio", tags: ["gaming", "consumer-tech"], src: PORT_SRC },
  { name: "Krrvy", what: "Shapewear & lingerie brand", tags: ["consumer-brand", "fashion", "d2c"], src: PORT_SRC },
  { name: "Mixar", what: "AI 3D modelling & animation", tags: ["ai", "creative-tools", "b2b-saas"], src: PORT_SRC },
];

/** Partner rules quoted from the meeting notes, applied by the engine as policy (not as scores). */
export const PARTNER_RULES = [
  { rule: "A missing deciding number drags the score; it is never skipped.", who: "Kushal", src: NOTES(1, "Petalry") },
  { rule: "A founder getting defensive when pushed is information. Write it down.", who: "Kushal", src: NOTES(1, "General") },
  { rule: "Score the evidence, not the pedigree. Founder quality and path-to-market are separate criteria.", who: "Kushal", src: NOTES(3, "Scoring") },
  { rule: "Deeptech: Aditya joins the call; partners run the second call themselves.", who: "Aditya", src: NOTES(3, "AeroDrop") },
  { rule: "Check every application against the full portfolio list. A false alarm beats a missed conflict.", who: "Kushal", src: NOTES(4, "Conflict check") },
  { rule: "Calls: Tuesday or Thursday afternoons, 30 minutes.", who: "Team", src: NOTES(5, "Process") },
  { rule: "Kushal sees every outcome. Nobody is auto-rejected or auto-advanced.", who: "Kushal", src: NOTES(5, "Process") },
  { rule: "Every corrected score gets a one-line reason so it can be reused for similar companies.", who: "Kushal", src: NOTES(5, "Process") },
  { rule: "Say which thesis you scored against and why.", who: "Kushal", src: NOTES(5, "Riya's drift observation") },
  { rule: "No written disqualification checklists — founders learn to pass them. Rules stay judgement aids.", who: "Kushal", src: NOTES(2, "CampusCredit") },
];
