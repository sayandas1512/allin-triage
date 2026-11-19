import { NOTES, WEB } from "./thesis";
import type { Application, SourceRef } from "./types";

const D = (n: number, what = ""): SourceRef => ({ kind: "deck", ref: `Deck · slide ${n}${what ? ` · ${what}` : ""}` });
const F = (field: string): SourceRef => ({ kind: "form", ref: `Form · ${field}` });
const M = (name: string): SourceRef => ({ kind: "memo", ref: `Memo · ${name}` });
const X = (what: string): SourceRef => ({ kind: "derived", ref: `Arithmetic · ${what}` });
const LI: SourceRef = { kind: "web", ref: "Founder LinkedIn URLs (placeholder .example domains)" };

const FOUNDER_WEB_GAP = (names: string) => ({
  what: `Independent founder background for ${names}`,
  tried: "Looked up the LinkedIn and company URLs given in the form. All resolve to placeholder .example domains; no public footprint found.",
  cost: "Founder–market fit rests on self-reported history only. Confidence on that criterion is capped until a reference check or a call.",
});

export const APPLICATIONS: Application[] = [
  // ───────────────────────────────────────────────────────────── 1. StockSathi
  {
    id: "stocksathi",
    name: "StockSathi",
    oneLiner: "Restocking app with short-term credit for small-town kirana stores",
    city: "Hyderabad",
    sectorSelected: "Consumer tech",
    sectorActual: "Fintech",
    stage: "Pre-seed",
    raiseCr: 2,
    postMoneyCr: 12,
    incorporated: "Mar 2026",
    source: "Warm intro (Fund I founder)",
    founders: [
      { name: "Aarav Deshmukh", role: "CEO", background: "8 yrs FMCG distribution; ran a regional sales team at a large distributor" },
      { name: "Pooja Nair", role: "CTO", background: "5 yrs software engineer at a payments company; built ordering app & credit rules" },
    ],
    headline: [
      { label: "Retailers", value: "38 / 42" },
      { label: "Reorder rate", value: "22 of 38" },
      { label: "Oct GMV", value: "₹3.8 L" },
      { label: "Credit book", value: "₹85k · 12 stores" },
    ],
    tags: ["commerce-infra", "small-town", "kirana", "lending", "field-first", "b2b-marketplace"],
    summary:
      "Field-first founders in SuperK territory with real reorder behaviour. The question is the credit: the deck and form give different answers on who funds it, and the company is not a registered lender. That has to be settled on the call, Jai Kisan-style.",
    assessments: [
      {
        criterion: "founder_market",
        score: 8,
        rationale: "Distribution operator plus a payments engineer who wrote the credit rules — the two skills this needs. 60 owner interviews before building.",
        evidence: [
          { claim: "CEO: 8 years FMCG distribution, ran a regional sales team at a distributor", source: [D(10), F("Founder 1")], verification: "consistent" },
          { claim: "CTO: 5 years at a payments company; built the ordering app and credit-scoring rules", source: [D(10), F("Founder 2")], verification: "consistent" },
          { claim: "60 owner interviews in Karimnagar and Warangal, Jun–Jul 2026", source: [D(2, "footnote")], verification: "claimed" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 5,
        rationale:
          "They take first loss and follow up personally on late payments — owning collections is the Jai Kisan signal. But the deck and form disagree on who funds credit, they are not an NBFC, and they cite an outside opinion ('we have been told') as proof of their scoring edge on 12 borrowers.",
        evidence: [
          { claim: "\"We take the first-loss risk\"; \"we follow up personally on late payments\"", source: [F("Credit")], verification: "claimed" },
          { claim: "Deck: credit 'funded from our own capital for now; NBFC partnership in discussion'. Form: 'provided through our NBFC partner'", source: [D(7), F("How is credit funded?")], verification: "contradicted" },
          { claim: "Not registered as an NBFC", source: [F("Regulatory status")], verification: "claimed" },
          { claim: "RBI caps default-loss guarantees at 5% of the covered portfolio (Jun 2023)", source: [WEB.dlg], verification: "external" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 5,
        rationale:
          "The deck is honest about CAC (shows its working, flags small sample). The form then rounds it down to 'under ₹2,000'. Retailer counts also differ. Repeat is real but measured over weeks, not cohorts.",
        evidence: [
          { claim: "Deck CAC ₹2,860 (₹40k field cost / 14 stores, 'small sample, one town') vs form 'under ₹2,000'", source: [D(7), F("Customer acquisition")], verification: "contradicted" },
          { claim: "38 retailers onboarded (deck) vs 42 (form)", source: [D(5), F("Active customers")], verification: "contradicted" },
          { claim: "22 retailers have ordered more than once; reorder about weekly", source: [D(5), F("Repeat behaviour")], verification: "consistent" },
          { claim: "Oct GMV ₹3.8 L; ~₹9 L over three months — plausible together", source: [D(5), F("Revenue / GMV"), X("3-month GMV vs October")], verification: "consistent" },
          { claim: "Zero defaults on a ₹85k book across 12 retailers", source: [F("Defaults to date")], verification: "claimed" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 6,
        rationale: "Store-to-store referrals (9 of 38) and weekly reorders show pull. One town only; the agent-free channel is a plan, not a result.",
        evidence: [
          { claim: "Channels: field agents 24, neighbour referrals 9, distributor intros 5", source: [D(7)], verification: "claimed" },
          { claim: "Live in Karimnagar only", source: [F("What have you built?")], verification: "claimed" },
          { claim: "Payback ~5.5 months on trade margin alone", source: [D(7)], verification: "claimed" },
        ],
      },
      {
        criterion: "capital_fit",
        score: 6,
        rationale: "₹2 Cr at ₹12 Cr post sits well inside a first cheque. But 40% goes into the credit book — equity funding loans is the expensive way to lend.",
        evidence: [
          { claim: "Raising ₹2 Cr at ₹12 Cr post", source: [F("Fundraising")], verification: "claimed" },
          { claim: "Use of funds: 40% credit book, 35% team & tech, 25% two new towns", source: [D(11)], verification: "claimed" },
        ],
      },
      {
        criterion: "defensibility",
        score: 5,
        rationale: "Vernacular, small-town focus and field execution are hard to copy (SuperK). But well-funded B2B players are moving into the same towns with embedded credit.",
        evidence: [
          { claim: "Jumbotail raised $120M (Jun 2025) and acquired Solv to add credit for small retailers", source: [WEB.jumbotail], verification: "external" },
          { claim: "Udaan reported moving into regional depth via ShopKirana talks", source: [WEB.kiranaCaptable], verification: "external" },
          { claim: "Competition table lists credit on orders as 'Pilot'", source: [D(9)], verification: "claimed" },
        ],
      },
      {
        criterion: "thesis_fit",
        score: 8,
        statedScore: 6,
        rationale:
          "Stated: filed as consumer tech, but it is B2B commerce plus lending — the label fits loosely. Revealed: small-town commerce infrastructure run by founders who live in the field is exactly the SuperK / Jai Kisan pattern Riya says now excites the partners.",
        evidence: [
          { claim: "Sector selected: Consumer tech", source: [F("Sector")], verification: "claimed" },
          { claim: "Revealed-thesis precedents: SuperK (invested), Jai Kisan (invested)", source: [M("SuperK"), M("Jai Kisan"), NOTES(5, "drift")], verification: "external" },
        ],
      },
    ],
    flags: [
      { severity: "high", title: "Deck and form disagree on who funds credit", detail: "Deck: own capital, NBFC 'in discussion'. Form: provided through NBFC partner, StockSathi takes first loss. Either the structure changed in weeks or one document is wrong.", source: [D(7), F("How is credit funded?")] },
      { severity: "high", title: "Lending without a licence", detail: "Not an NBFC. If the book is on its own balance sheet, that is a regulatory exposure; if it is a DLG with an NBFC, first loss is capped at 5% of the portfolio.", source: [F("Regulatory status"), WEB.dlg] },
      { severity: "medium", title: "CAC rounded down between documents", detail: "₹2,860 measured (deck) became 'under ₹2,000' (form). ₹2,000 is the 12-month target on slide 11.", source: [D(7), D(11), F("Customer acquisition")] },
      { severity: "medium", title: "Retailer count differs", detail: "38 (deck) vs 42 (form). Possibly onboarding since the deck — ask.", source: [D(5), F("Active customers")] },
      { severity: "info", title: "Warm intro from a Fund I founder", detail: "Referrer not named in the application. Worth asking who, and what they have seen.", source: [F("How did you hear about us?")] },
      { severity: "info", title: "Sector mislabelled", detail: "Selected 'Consumer tech'; it is B2B commerce with embedded lending. Scored as fintech for the deciding metric.", source: [F("Sector")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Aarav Deshmukh and Pooja Nair"),
      { what: "Name and terms of the NBFC partner", tried: "Not in deck or form; no public announcement found.", cost: "Cannot tell whether the credit is compliant, or who loses money first. Risk-ownership score held at 5 pending the call." },
      { what: "Credit performance at any meaningful size", tried: "Only 12 borrowers, ₹85k outstanding, a few weeks old.", cost: "'No defaults' carries almost no information. The credit-scoring 'edge' is untested." },
      { what: "Month-by-month GMV", tried: "Deck shows October only; form gives a three-month total.", cost: "Growth rate cannot be computed." },
    ],
    gates: [],
    precedents: [
      { memoId: "superk", why: "Small-town retail; founders on the ground learning what owners actually want (working capital, price)." },
      { memoId: "jaikisan", why: "Lending where the deciding question was whether the founders treated risk as theirs." },
      { memoId: "campuscredit", why: "The failure mode: credit through an NBFC partner with risk treated as someone else's." },
    ],
    callQuestions: [
      "Today, whose money is in the ₹85k book — yours or the NBFC's? Walk me through the exact first-loss terms.",
      "If three of the twelve stopped paying next month, what happens, and who calls them?",
      "Reconcile 38 vs 42 retailers and ₹2,860 vs 'under ₹2,000' CAC.",
      "Which Fund I founder introduced you, and what have they seen of the business?",
    ],
    wouldChangeView: ["A signed NBFC/DLG structure that is RBI-compliant", "Credit performance on 50+ stores over two cycles", "A second town at comparable CAC"],
  },

  // ───────────────────────────────────────────────────────────── 2. Talkbook
  {
    id: "talkbook",
    name: "Talkbook",
    oneLiner: "AI call summaries and CRM updates for Indian sales teams, incl. code-mixed languages",
    city: "Chennai",
    sectorSelected: "Consumer tech",
    sectorActual: "B2B SaaS",
    stage: "Pre-seed",
    raiseCr: 2,
    postMoneyCr: 12,
    incorporated: "Feb 2026",
    source: "Public form",
    founders: [
      { name: "Arun Kumar", role: "CEO", background: "6 yrs product lead at a CRM software company" },
      { name: "Meenakshi S", role: "CTO", background: "4 yrs speech ML at a speech-technology company" },
    ],
    headline: [
      { label: "Paying teams", value: "16" },
      { label: "Seats", value: "340" },
      { label: "MRR", value: "₹1.7–2.1 L" },
      { label: "Gross margin", value: "70%" },
    ],
    tags: ["sales-ai", "call-recording", "b2b-saas", "crm", "speech-ml"],
    summary:
      "A credible team with an India-specific wedge (code-mixed speech) — and a direct overlap with MeetRecord, already in the portfolio. Nothing in the application mentions MeetRecord. This is the Meeting 4 near-miss repeating: hold until Kushal has spoken to the MeetRecord founder.",
    assessments: [
      {
        criterion: "founder_market",
        score: 7,
        rationale: "CRM product lead + speech-ML engineer is the right pair; code-mixed transcription is a plausible earned secret.",
        evidence: [
          { claim: "CEO 6 yrs product lead at a CRM company; CTO 4 yrs speech ML", source: [D(10), F("Founders")], verification: "consistent" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 6,
        rationale: "Names call-recording law, noisy-call accuracy and BFSI concentration unprompted, and loads founder time into CAC. No answer yet on what happens when a global tool ships Hindi-English.",
        evidence: [
          { claim: "Key risks: telecom call-recording restrictions, accuracy on noisy calls, BFSI concentration", source: [F("Key risks")], verification: "claimed" },
          { claim: "CAC includes founder time at a nominal salary", source: [D(8), F("Unit economics")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 5,
        rationale: "Three different MRR numbers across deck, form and arithmetic. No churn or retention figure — the deciding SaaS number is missing.",
        evidence: [
          { claim: "MRR ₹2.1 L (deck) vs ₹1.9 L (form)", source: [D(6), F("Revenue")], verification: "contradicted" },
          { claim: "340 seats × ₹500 = ₹1.7 L, not ₹1.9 L or ₹2.1 L", source: [X("seats × price")], verification: "contradicted" },
          { claim: "CAC ₹48k per team, payback ~5 months, GM 70%", source: [D(8), F("Unit economics")], verification: "consistent" },
          { claim: "No churn or logo-retention figure given", source: [F("Customers")], verification: "unverifiable" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 7,
        rationale: "16 paying teams in four months; 5 came by referral, which is pull.",
        evidence: [
          { claim: "16 paying teams: 9 founder outbound, 5 referrals, 2 CRM consultants", source: [D(8), F("Customer acquisition")], verification: "consistent" },
        ],
      },
      {
        criterion: "capital_fit",
        score: 8,
        rationale: "Capital-light SaaS; ₹2 Cr at ₹12 Cr post is a clean pre-seed round.",
        evidence: [{ claim: "Raising ₹2 Cr at ₹12 Cr post; no existing investors", source: [F("Fundraising")], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 5,
        rationale: "The 'why now' (cheaper, better speech models) also lowers the bar for everyone else. A funded India player already exists — in our own portfolio.",
        evidence: [
          { claim: "\"We do not know of an India-first player\"", source: [F("Competition")], verification: "contradicted" },
          { claim: "MeetRecord (AI conversation intelligence for sales) raised $2.7M in 2024 with All In participating", source: [WEB.meetrecordRound], verification: "external" },
          { claim: "Inference cost per call minute down 8x in two years", source: [D(4)], verification: "claimed" },
        ],
      },
      {
        criterion: "thesis_fit",
        score: 6,
        statedScore: 7,
        rationale: "Stated: AI SaaS is close to the fund's AI-SaaS seed programme, though filed as consumer tech. Revealed: B2B SaaS is in the portfolio (SuprSend, CommandK, MeetRecord).",
        evidence: [
          { claim: "All In runs a seed programme for AI SaaS founders", source: [WEB.viAISaaS], verification: "external" },
          { claim: "Sector selected: Consumer tech", source: [F("Sector")], verification: "claimed" },
        ],
      },
    ],
    flags: [
      { severity: "critical", title: "Portfolio overlap: MeetRecord", detail: "MeetRecord sells AI call analysis and coaching to sales teams. The application does not mention it. Default per Meeting 4 is no, unless both founders know.", source: [WEB.meetrecordRound, NOTES(4, "Conflict check")] },
      { severity: "medium", title: "MRR does not reconcile", detail: "₹2.1 L (deck), ₹1.9 L (form), ₹1.7 L (340 × ₹500).", source: [D(6), F("Revenue"), X("seats × price")] },
      { severity: "info", title: "Sector mislabelled", detail: "Filed as consumer tech; it is B2B SaaS.", source: [F("Sector")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Arun Kumar and Meenakshi S"),
      { what: "Churn / logo retention", tried: "Not in deck or form.", cost: "Cannot tell if 16 teams is a base or a leaky bucket. Evidence score held at 5." },
      { what: "Legal posture on call recording consent", tried: "Named as a risk; no detail.", cost: "Unknown exposure in BFSI, their largest segment." },
    ],
    gates: [
      { kind: "portfolio_conflict", hard: true, title: "Overlaps portfolio company MeetRecord", detail: "Same buyer (sales leaders), same job (call capture, summaries, CRM update). Kushal speaks to the MeetRecord founder before anything else happens.", source: [WEB.meetrecordRound, NOTES(4, "Conflict check")] },
    ],
    precedents: [
      { memoId: "unbox", why: "Founders who describe failure modes unprompted — Talkbook partly does this." },
    ],
    callQuestions: [
      "(Only after the MeetRecord conversation.) Have you come across MeetRecord, and how do you see the overlap?",
      "Which MRR number is right, and how many of the 16 teams have expanded or churned?",
      "How do you get consent on recorded BFSI calls today?",
    ],
    wouldChangeView: ["Cleared conflict with MeetRecord's founder", "Clean MRR and 6-month logo retention"],
  },

  // ───────────────────────────────────────────────────────────── 3. CAPilot
  {
    id: "capilot",
    name: "CAPilot",
    oneLiner: "AI assistant for CA firms: GST reconciliation and notice replies",
    city: "Ahmedabad",
    sectorSelected: "Fintech",
    sectorActual: "B2B SaaS",
    stage: "Pre-seed",
    raiseCr: 1.5,
    postMoneyCr: 10,
    incorporated: "Dec 2025",
    source: "Public form",
    founders: [
      { name: "Dhruv Shah", role: "CEO", background: "Qualified CA; 4 yrs in practice handling GST for ~60 clients" },
      { name: "Isha Merchant", role: "CTO", background: "3 yrs at a SaaS company; built the matching engine" },
    ],
    headline: [
      { label: "MRR", value: "₹78k" },
      { label: "MRR Aug→Oct", value: "18k → 78k" },
      { label: "Paying firms", value: "24 (+7 trial)" },
      { label: "Churned", value: "2" },
    ],
    tags: ["b2b-saas", "ai", "accounting", "compliance", "smb"],
    summary:
      "A CA building for CAs: the strongest earned-secret story in the batch, and MRR quadrupled in three months. The deck counts free trials as paying customers and sizes the market top-down; liability for errors is pushed to the customer. Worth a partner read, not yet a call.",
    assessments: [
      {
        criterion: "founder_market",
        score: 8,
        rationale: "The CEO did this work for 60 clients — he is the user. CTO built the engine.",
        evidence: [
          { claim: "CEO qualified CA, 4 yrs practice, GST for ~60 clients", source: [D(9), F("Founder 1")], verification: "consistent" },
          { claim: "Customers mostly from founders' network and CA referrals", source: [F("Customer acquisition")], verification: "claimed" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 5,
        rationale: "Names model errors and GST portal format dependence. But 'responsibility sits with the CA' is the same move as 'the NBFC handles it' — fine legally, weak as a product stance in a trust business.",
        evidence: [
          { claim: "\"Every drafted reply is reviewed by the CA. Responsibility sits with the CA.\"", source: [F("Accuracy and liability")], verification: "claimed" },
          { claim: "Key risks: model errors on unusual notices, GST portal data formats", source: [F("Key risks")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 4,
        rationale: "Deck shows 31 'paying' firms; form says 24 paying and 7 on free trial. CAC not measured. Market sized as 1% of the whole tax services market.",
        evidence: [
          { claim: "Deck: 31 paying CA firms. Form: 24 paying + 7 free trial", source: [D(5), F("Customers")], verification: "contradicted" },
          { claim: "MRR ₹18k → ₹41k → ₹78k (Aug–Oct); ₹78k × 12 = ₹9.4 L ARR", source: [D(5), F("Revenue"), X("MRR × 12")], verification: "consistent" },
          { claim: "\"We have not measured acquisition cost yet\"", source: [F("Customer acquisition")], verification: "claimed" },
          { claim: "TAM: '1% of ₹1.4 lakh Cr' — services spend, not software spend", source: [D(6)], verification: "claimed" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 6,
        rationale: "Strong early pull through CA referrals; unproven beyond the founder's network.",
        evidence: [
          { claim: "2 firms churned out of ~26 who paid", source: [D(5), F("Customers")], verification: "consistent" },
          { claim: "12-month target 150 firms and ₹7 L MRR", source: [D(10)], verification: "claimed" },
        ],
      },
      {
        criterion: "capital_fit",
        score: 8,
        rationale: "₹1.5 Cr at ₹10 Cr; SaaS, capital-light.",
        evidence: [{ claim: "Raising ₹1.5 Cr at ₹10 Cr post; one angel ₹15 L", source: [F("Fundraising")], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 5,
        rationale: "Notice-reply drafting is a sharp wedge; incumbents (ClearTax, Tally, Zoho) own the books and could add it.",
        evidence: [
          { claim: "Competition table: only CAPilot does AI notice replies", source: [D(8)], verification: "claimed" },
        ],
      },
      {
        criterion: "thesis_fit",
        score: 7,
        statedScore: 7,
        rationale: "Filed as fintech; really vertical AI SaaS. Fits the AI-SaaS programme and the B2B SaaS in the portfolio.",
        evidence: [{ claim: "All In runs a seed programme for AI SaaS founders", source: [WEB.viAISaaS], verification: "external" }],
      },
    ],
    flags: [
      { severity: "high", title: "Free trials counted as paying", detail: "Deck headline '31 paying CA firms' includes 7 firms on free trial (form).", source: [D(5), F("Customers")] },
      { severity: "medium", title: "Liability pushed to the customer", detail: "All error responsibility sits with the CA. Fine contractually; a reputational risk for the CA that the product does not address.", source: [F("Accuracy and liability")] },
      { severity: "info", title: "Top-down market sizing", detail: "'1% of ₹1.4 lakh Cr' — the memos treat aspirational sizing as noise (ePlane).", source: [D(6), M("ePlane")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Dhruv Shah and Isha Merchant"),
      { what: "CAC and sales motion beyond the network", tried: "Founders say not measured.", cost: "Path to 150 firms cannot be checked." },
      { what: "Accuracy rate on drafted replies", tried: "Not given.", cost: "The core claim (saves 3–5 hours per notice) is unproven." },
    ],
    gates: [],
    precedents: [
      { memoId: "wint", why: "Founder sat with the customer first; trust, not technology, is the bottleneck." },
      { memoId: "campuscredit", why: "Echo of 'someone else handles the risk' in the liability answer." },
    ],
    callQuestions: [
      "Of the 24 paying firms, how many came from outside your own network?",
      "What is your accuracy on notice replies, and what happens to the CA when a draft is wrong?",
      "Why count trials as paying on slide 5?",
    ],
    wouldChangeView: ["Measured CAC from non-network firms", "Published accuracy on 100+ drafted notices"],
  },

  // ───────────────────────────────────────────────────────────── 4. CareCorner
  {
    id: "carecorner",
    name: "CareCorner",
    oneLiner: "Neighbourhood primary-care clinics with in-house diagnostics for Tier-2 India",
    city: "Hyderabad",
    sectorSelected: "Other (Healthcare)",
    sectorActual: "Healthcare",
    stage: "Pre-seed",
    raiseCr: 3,
    postMoneyCr: 18,
    incorporated: "Aug 2025",
    source: "Public form",
    founders: [
      { name: "Dr. Lakshmi Reddy", role: "CEO", background: "MBBS; 8 yrs family medicine; designs clinical protocols" },
      { name: "Vikram Rao", role: "COO", background: "6 yrs operations at a hospital chain; runs site selection & rollout" },
    ],
    headline: [
      { label: "Clinics", value: "3" },
      { label: "Oct revenue", value: "₹9.8 L" },
      { label: "Breakeven", value: "Month 8" },
      { label: "Capex / clinic", value: "₹28 L" },
    ],
    tags: ["healthcare", "offline", "capital-intensive", "tier-2", "services"],
    summary:
      "The cleanest numbers in the batch and a strong doctor-operator pair — offering clinic P&Ls unprompted. But it is capex-led care delivery outside the four stated sectors, and every new clinic costs ₹28 L. This is a HopBox-shaped question: pass on structure, not people — unless a partner wants to stretch the thesis.",
    assessments: [
      {
        criterion: "founder_market",
        score: 8,
        rationale: "Clinician who designs protocols + hospital-chain operator who runs rollout. Built 3 clinics before raising.",
        evidence: [
          { claim: "CEO MBBS, 8 yrs family medicine; COO 6 yrs hospital-chain ops", source: [D(8), F("Founders")], verification: "consistent" },
          { claim: "Household spend estimated from clinic billing and a 90-household survey", source: [D(6)], verification: "claimed" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 8,
        rationale: "Names capital intensity, doctor retention and slower ramp themselves; offers clinic-level P&Ls.",
        evidence: [
          { claim: "Key risks: capital intensity, doctor retention, slower ramp", source: [F("Key risks")], verification: "claimed" },
          { claim: "\"We can share clinic-level P&Ls\"", source: [F("Anything else")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 7,
        rationale: "Bottom-up sizing with stated assumptions, CAC per patient, capex per clinic, revenue mix. Missing: repeat visits per family and per-clinic margins.",
        evidence: [
          { claim: "Revenue ₹3.9 L → ₹9.8 L, Jun–Oct; Oct figure matches form", source: [D(5), F("Revenue")], verification: "consistent" },
          { claim: "CAC ₹210 per new patient; channel split 45/35/20", source: [D(7), F("Patient acquisition")], verification: "consistent" },
          { claim: "SOM: 25 clinics × ₹1.4 Cr revenue each", source: [D(6)], verification: "claimed" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 7,
        rationale: "Referral-led demand already working across three sites.",
        evidence: [{ claim: "First clinic breakeven in month 8", source: [D(5), F("Revenue")], verification: "consistent" }],
      },
      {
        criterion: "capital_fit",
        score: 3,
        rationale: "₹28 L capex per clinic plus working capital; ₹3 Cr buys five clinics. Reaching 25 clinics needs far more than a pre-seed cheque and a bank loan is already in the stack.",
        evidence: [
          { claim: "Capex ₹28 L per clinic, funded by angels and a ₹40 L bank loan", source: [D(7), F("Capex")], verification: "consistent" },
          { claim: "₹3 Cr at ₹18 Cr post; 47% to five new clinics", source: [D(9), F("Fundraising")], verification: "claimed" },
        ],
      },
      {
        criterion: "defensibility",
        score: 5,
        rationale: "Local trust and doctor referrals compound slowly; model is replicable by chains and depends on retaining doctors.",
        evidence: [{ claim: "45% of new patients from local doctor referrals", source: [D(7)], verification: "claimed" }],
      },
      {
        criterion: "thesis_fit",
        score: 4,
        statedScore: 3,
        rationale: "Outside all four stated sectors. The portfolio's healthcare exposure (MedMitra) is software, not care delivery.",
        evidence: [
          { claim: "Fund II focus: fintech, deeptech, consumer tech, consumer brands", source: [WEB.outlookFund2], verification: "external" },
          { claim: "MedMitra (AI co-pilot for physicians) is the only healthcare name found in the portfolio", source: [WEB.outlookFund2], verification: "external" },
        ],
      },
    ],
    flags: [
      { severity: "medium", title: "Capex-led growth", detail: "Same structural shape as HopBox: the model works, but scaling it needs capital the fund doesn't deploy.", source: [D(7), M("HopBox")] },
      { severity: "info", title: "Outside stated sectors", detail: "Healthcare services. Jai Kisan shows the label is not decisive — a partner call.", source: [F("Sector"), M("Jai Kisan")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Dr. Lakshmi Reddy and Vikram Rao"),
      { what: "Clinic-level P&L", tried: "Offered on request; not attached.", cost: "Breakeven claim not verified — request before any call." },
      { what: "Doctor retention to date", tried: "Named as a risk; no figures.", cost: "The model's biggest operating risk is unmeasured." },
    ],
    gates: [
      { kind: "sector_outside", hard: false, title: "Healthcare services — outside the four stated sectors", detail: "Not disqualifying (Jai Kisan precedent) but needs a partner to choose to stretch.", source: [WEB.outlookFund2] },
    ],
    precedents: [
      { memoId: "hopbox", why: "Excellent operators, model needs more capital than a pre-seed cheque — passed on structure." },
      { memoId: "jaikisan", why: "Partners stretched the sector label when founder behaviour was strong." },
    ],
    callQuestions: [
      "What does clinic #4 look like if you only have ₹1 Cr — can you franchise or lease instead of building?",
      "How many doctors have you lost, and how long does a new clinic take to replace one?",
    ],
    wouldChangeView: ["An asset-light expansion model (franchise/partner clinics)", "Partner decision to stretch the thesis into care delivery"],
  },

  // ───────────────────────────────────────────────────────────── 5. EarnWise
  {
    id: "earnwise",
    name: "EarnWise",
    oneLiner: "Earned wage access for India's gig and shift workers",
    city: "Gurugram",
    sectorSelected: "Fintech",
    sectorActual: "Fintech",
    stage: "Pre-seed",
    raiseCr: 2,
    postMoneyCr: 12,
    incorporated: "Jan 2026",
    source: "Public form",
    founders: [{ name: "Rohit Arora", role: "Founder & CEO", background: "Deck: 'Ex-Goldman Sachs, Ex-Google, MBA IIM Ahmedabad'. Form: 10-week IB internship, 5-month vendor contract, tier-2 MBA, 18 months at a payments startup" }],
    headline: [
      { label: "Clients live", value: "1 (deck: 3)" },
      { label: "Workers", value: "1,600" },
      { label: "Advanced", value: "₹38 L" },
      { label: "Co-founders", value: "0 (one left)" },
    ],
    tags: ["fintech", "lending", "nbfc-partner", "consumer-credit", "payroll"],
    summary:
      "The deck materially overstates the founder's background and the client count, both of which the form then corrects. Advances are partly funded from the founder's savings, the co-founder left, and tech is outsourced. Lean pass — and the discrepancy itself is the most important finding.",
    assessments: [
      {
        criterion: "founder_market",
        score: 2,
        rationale: "18 months at a payments startup is relevant. The rest of the deck's pedigree does not survive the form, and Meeting 3 says score the evidence, not the pedigree.",
        evidence: [
          { claim: "Deck: 'Ex-Goldman Sachs. Ex-Google. MBA, IIM Ahmedabad'", source: [D(8)], verification: "contradicted" },
          { claim: "Form: 10-week summer analyst internship at an investment bank; 5-month vendor contract at a tech company; tier-2 MBA", source: [F("Founder")], verification: "contradicted" },
          { claim: "Co-founder left in July 2026; tech 'led by an advisor'; 2 outsourced developers", source: [F("Earlier co-founder"), F("Team size"), D(8)], verification: "consistent" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 2,
        rationale: "Names only regulation and payroll integration. Nothing on employer default, worker churn before payday, or what happens if the NBFC 'agreement in principle' doesn't close — while personal savings fund part of the book.",
        evidence: [
          { claim: "Advances funded by an NBFC 'agreement in principle' and partly by the founder's savings", source: [F("Funding of advances")], verification: "claimed" },
          { claim: "Key risks named: digital lending regulation, payroll integration", source: [F("Key risks")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 2,
        rationale: "Client count contradicts itself, there is no fee revenue, no repayment or loss data, and the TAM assumes every worker draws ₹12,000 every month.",
        evidence: [
          { claim: "Deck: '3 enterprise clients live'. Form: 1 live, 2 in pilot", source: [D(6), F("Customers")], verification: "contradicted" },
          { claim: "₹38 L advanced since July; no revenue or default figure given", source: [D(6), F("Advances")], verification: "claimed" },
          { claim: "TAM 10M × ₹12,000 × 12 = ₹14,400 Cr (arithmetic holds; assumption does not)", source: [D(7), X("TAM")], verification: "consistent" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 4,
        rationale: "One live employer from founder outreach. The category has established players he doesn't mention.",
        evidence: [
          { claim: "Customer acquisition: founder outreach to HR heads", source: [F("Customer acquisition")], verification: "claimed" },
          { claim: "EWA already offered by Refyne and payroll platforms with NBFC partners", source: [WEB.ewa], verification: "external" },
        ],
      },
      {
        criterion: "capital_fit",
        score: 4,
        rationale: "₹2 Cr round size fits, but 40% is to fund the advances book — equity money as loan capital.",
        evidence: [{ claim: "Use of funds: 40% advances book, 30% sales, 30% team", source: [D(9)], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 3,
        rationale: "No stated edge in a category with funded incumbents.",
        evidence: [{ claim: "No competition slide; 'we have a strong market and we are moving fast'", source: [F("Anything else")], verification: "claimed" }],
      },
      {
        criterion: "thesis_fit",
        score: 5,
        statedScore: 7,
        rationale: "Fintech by label. Under the revealed thesis, lending only fits when founders own the risk (CampusCredit vs Jai Kisan).",
        evidence: [{ claim: "Revealed precedent: CampusCredit (passed)", source: [M("CampusCredit")], verification: "external" }],
      },
    ],
    flags: [
      { severity: "critical", title: "Founder background overstated in the deck", detail: "Deck: Ex-Goldman, Ex-Google, IIM Ahmedabad. Form: a 10-week internship, a 5-month vendor contract, a tier-2 MBA. The form is the more specific document.", source: [D(8), F("Founder")] },
      { severity: "high", title: "Client count overstated in the deck", detail: "3 enterprise clients 'live' (deck) vs 1 live + 2 pilots (form).", source: [D(6), F("Customers")] },
      { severity: "high", title: "Founder's savings fund part of the book", detail: "NBFC agreement is 'in principle'. The founder is personally lending to workers.", source: [F("Funding of advances")] },
      { severity: "medium", title: "Solo founder; co-founder left; outsourced tech", detail: "Co-founder departed July 2026. Tech led by an advisor and two outsourced developers.", source: [F("Earlier co-founder"), F("Team size")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Rohit Arora"),
      { what: "Why the co-founder left", tried: "Not explained in the form.", cost: "Unknown; relevant given the discrepancies." },
      { what: "Repayment and loss data", tried: "Not given.", cost: "Cannot assess the book at all." },
    ],
    gates: [],
    precedents: [
      { memoId: "campuscredit", why: "Lending via an NBFC partner, founder does not engage with credit risk." },
      { memoId: "petalry", why: "Polished story; founder unaware of the gap between presentation and numbers." },
    ],
    callQuestions: [],
    wouldChangeView: ["A signed NBFC agreement funding 100% of advances", "A technical co-founder", "Three live employers with repayment data"],
  },

  // ───────────────────────────────────────────────────────────── 6. GrainKind
  {
    id: "grainkind",
    name: "GrainKind",
    oneLiner: "Millet-based breakfast and snacks for urban families",
    city: "Bengaluru",
    sectorSelected: "Consumer brands",
    sectorActual: "Consumer brands",
    stage: "Pre-seed",
    raiseCr: 2.5,
    postMoneyCr: 14,
    incorporated: "Jul 2025",
    source: "Public form",
    founders: [
      { name: "Ritu Hegde", role: "CEO", background: "6 yrs category & brand roles at a large packaged-food company; food science" },
      { name: "Sanjay Kulkarni", role: "COO", background: "5 yrs supply chain at a quick-commerce company; runs sourcing & co-packer" },
    ],
    headline: [
      { label: "Oct revenue", value: "₹16.5 L" },
      { label: "90-day repeat", value: "31→34→38%" },
      { label: "Gross margin", value: "48%" },
      { label: "LTV : CAC", value: "1.8x" },
    ],
    tags: ["consumer-brand", "d2c", "food", "cohorts", "single-manufacturer"],
    summary:
      "The brand that passes the test Petalry failed: cohort repeat by month, gross margin, CAC by channel, consistent across deck and form — plus an operations co-founder. Risks are named by the founders themselves. Take the call.",
    assessments: [
      {
        criterion: "founder_market",
        score: 8,
        rationale: "Brand/category operator with food science, plus a supply-chain co-founder who runs the co-packer — the exact gap Petalry lacked.",
        evidence: [
          { claim: "CEO 6 yrs category & brand at packaged-food co; COO 5 yrs quick-commerce supply chain", source: [D(10), F("Founders")], verification: "consistent" },
          { claim: "Survey of 420 urban parents, Jul 2025", source: [D(2)], verification: "claimed" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 8,
        rationale: "Names single co-packer, rising paid social and their own weakest SKU's repeat. Offers cohort sheet and co-packer agreement.",
        evidence: [
          { claim: "Key risks: single co-packer, rising paid social, slower repeat on Jowar puffs", source: [F("Key risks")], verification: "claimed" },
          { claim: "\"We can share our cohort sheet and co-packer agreement\"", source: [F("Anything else")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 9,
        rationale: "The deciding consumer-brand numbers exist, improve by cohort, and match across documents.",
        evidence: [
          { claim: "90-day repeat 31% (Jun), 34% (Jul), 38% (Aug); 3,100 customers", source: [D(5), F("Repeat behaviour")], verification: "consistent" },
          { claim: "GM 48%; blended CAC ₹340; contribution after CAC & logistics 11%", source: [D(6), F("Unit economics")], verification: "consistent" },
          { claim: "Blended CAC ≈ 0.45×410 + 0.25×290 + 0.2×210 + 0.1×380 = ₹337", source: [X("channel-weighted CAC")], verification: "consistent" },
          { claim: "₹72 L revenue since Nov 2025 launch", source: [F("Revenue")], verification: "claimed" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 7,
        rationale: "Revenue tripled Jun→Oct across three channels; nutritionist referrals are the cheapest channel. Still 45% paid social.",
        evidence: [
          { claim: "Revenue ₹4.8 L → ₹16.5 L (Jun–Oct)", source: [D(5)], verification: "claimed" },
          { claim: "Channel mix: own site 55%, Amazon 25%, quick commerce 20%", source: [D(8), F("Channel mix")], verification: "consistent" },
        ],
      },
      {
        criterion: "capital_fit",
        score: 7,
        rationale: "₹2.5 Cr at ₹14 Cr; inventory-heavy but small at this scale.",
        evidence: [{ claim: "Raising ₹2.5 Cr at ₹14 Cr post; 40% inventory & working capital", source: [D(11), F("Fundraising")], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 5,
        rationale: "Taste-first is a real angle, but a Tata-owned millet brand exists and LTV:CAC of 1.8x is thin. Priced above mass brands.",
        evidence: [
          { claim: "Tata Consumer acquired Soulfull, a millet cereal & snack brand (2021)", source: [WEB.soulfull], verification: "external" },
          { claim: "₹62/100g vs ₹45 for large cereal brands", source: [D(9)], verification: "claimed" },
          { claim: "12-month LTV:CAC ~1.8x", source: [D(8), F("Unit economics")], verification: "consistent" },
        ],
      },
      {
        criterion: "thesis_fit",
        score: 9,
        statedScore: 9,
        rationale: "Consumer brand with real repeat — central under both readings.",
        evidence: [{ claim: "Revealed precedent: GIVA (invested on cohort fluency)", source: [M("GIVA")], verification: "external" }],
      },
    ],
    flags: [
      { severity: "medium", title: "Single co-packer", detail: "All products from one co-packer in Hosur — Petalry had the same single-manufacturer risk.", source: [D(10), M("Petalry")] },
      { severity: "info", title: "Thin LTV:CAC", detail: "1.8x at 12 months; target is to lift repeat to 45%.", source: [D(8)] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Ritu Hegde and Sanjay Kulkarni"),
      { what: "Cohort sheet", tried: "Offered on request.", cost: "Repeat figures are self-reported until the sheet is seen — request before the call." },
    ],
    gates: [],
    precedents: [
      { memoId: "giva", why: "Founder fluent in cohort repeat and margin — the test every brand is run against." },
      { memoId: "petalry", why: "The contrast case: paid-social growth, no repeat rate, no ops co-founder." },
    ],
    callQuestions: [
      "Walk us through the June cohort month by month without the deck.",
      "What happens to the business if the Hosur co-packer has a two-month outage?",
      "Why is Jowar puffs repeat slower, and would you cut it?",
    ],
    wouldChangeView: [],
  },

  // ───────────────────────────────────────────────────────────── 7. Pumpwise
  {
    id: "pumpwise",
    name: "Pumpwise",
    oneLiner: "Clip-on predictive maintenance for small-factory motors and pumps",
    city: "Pune",
    sectorSelected: "Deeptech",
    sectorActual: "Deeptech",
    stage: "Pre-seed",
    raiseCr: 2.2,
    postMoneyCr: 11,
    incorporated: "Oct 2025",
    source: "Public form",
    founders: [
      { name: "Karthik Subramanian", role: "CEO", background: "IIT Madras mechanical; 5 yrs reliability engineer at an engine maker" },
      { name: "Neeraj Pillai", role: "CTO", background: "4 yrs embedded systems at an auto-components supplier; designed sensor & firmware" },
    ],
    headline: [
      { label: "Pilot → paid", value: "6 of 11" },
      { label: "Sensors live", value: "140" },
      { label: "Sub. MRR", value: "₹1.05 L" },
      { label: "CAC", value: "₹73k" },
    ],
    tags: ["deeptech", "hardware", "industrial-iot", "b2b", "pilots", "msme"],
    summary:
      "Unbox Robotics in miniature: 38 plant visits before building, pilots treated as learning, and founders who flag that their own value figures are customer-reported and unaudited. Take the call — with Aditya, per the deeptech rule.",
    assessments: [
      {
        criterion: "founder_market",
        score: 9,
        rationale: "A reliability engineer who has watched motors fail, plus the engineer who designed the sensor. Visited 38 plants first.",
        evidence: [
          { claim: "CEO IIT Madras mech, 5 yrs reliability engineering; CTO designed sensor board & firmware", source: [D(11), F("Founders")], verification: "consistent" },
          { claim: "Visits to 38 plants in Pune and Coimbatore clusters, Nov 2025–Feb 2026", source: [D(2, "footnote")], verification: "claimed" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 8,
        rationale: "Says CAC excludes founder time, labels downtime savings as customer-reported and unaudited, and asks for help on calibration — failures described before being asked.",
        evidence: [
          { claim: "CAC 'excludes founder time'", source: [F("Customer acquisition")], verification: "claimed" },
          { claim: "Downtime savings 'customer-reported, not audited'", source: [F("Evidence of value")], verification: "claimed" },
          { claim: "Key risks: accuracy across motor types, hardware supply, longer cycles in larger plants", source: [F("Key risks")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 7,
        rationale: "Pilot-to-paid, CAC working and revenue split all reconcile. Too early for renewal data; no alert precision figure.",
        evidence: [
          { claim: "6 of 11 pilots converted (55%); 140 sensors ≈ 23 per customer", source: [D(6), F("Customers"), X("140 / 6")], verification: "consistent" },
          { claim: "CAC ₹4.4 L / 6 = ₹73k", source: [D(8), X("pilot cost / paid")], verification: "consistent" },
          { claim: "Revenue ₹14.2 L cumulative, ₹13.3 L of it hardware", source: [F("Revenue")], verification: "claimed" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 7,
        rationale: "5 of 6 paid customers came through cluster associations or pump distributors — channels that scale beyond founder time.",
        evidence: [{ claim: "Cluster associations 3, distributors 2, direct 1", source: [D(8), F("Customer acquisition")], verification: "consistent" }],
      },
      {
        criterion: "capital_fit",
        score: 7,
        rationale: "₹2.2 Cr at ₹11 Cr. Hardware carries working capital, but sensors have ~66% hardware margin.",
        evidence: [{ claim: "Sensor ₹9,500, cost ₹3,200; subscription ₹750/month at ~85% GM", source: [D(9)], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 6,
        rationale: "Well-funded incumbents serve large plants; the small-plant price point and cluster distribution are the wedge. Hardware is copyable.",
        evidence: [
          { claim: "Infinite Uptime (Pune) raised $35M Series C for industrial predictive maintenance", source: [WEB.infiniteUptime], verification: "external" },
          { claim: "Imported monitors cost ₹40,000+ per motor vs ₹9,500", source: [D(2), D(10)], verification: "claimed" },
        ],
      },
      {
        criterion: "thesis_fit",
        score: 7,
        statedScore: 8,
        rationale: "Applied deeptech with a near path to revenue — the Unbox shape.",
        evidence: [{ claim: "Revealed precedent: Unbox Robotics (invested)", source: [M("Unbox Robotics")], verification: "external" }],
      },
    ],
    flags: [
      { severity: "info", title: "Revenue is mostly hardware", detail: "₹13.3 L of ₹14.2 L is one-off sensor sales; recurring is ₹1.05 L/month.", source: [F("Revenue")] },
      { severity: "info", title: "Deeptech: Aditya joins", detail: "Per Meeting 3 rule; second call run by partners.", source: [NOTES(3, "AeroDrop")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Karthik Subramanian and Neeraj Pillai"),
      { what: "Alert precision / false-positive rate", tried: "Not given.", cost: "The 9 'caught early' stoppages could hide many false alarms." },
    ],
    gates: [],
    precedents: [
      { memoId: "unbox", why: "Hardware in live sites; founders treat pilots as learning; describe failures unprompted." },
      { memoId: "aerodrop", why: "The contrast: strong tech, no paying customer." },
    ],
    callQuestions: [
      "Of the 5 pilots that didn't convert, what broke?",
      "How many alerts fired for each real stoppage caught?",
      "Who owns calibration when you move from Pune to Coimbatore motors?",
    ],
    wouldChangeView: [],
  },

  // ───────────────────────────────────────────────────────────── 8. RentRoute
  {
    id: "rentroute",
    name: "RentRoute",
    oneLiner: "Pay your rent with your credit card",
    city: "Bengaluru",
    sectorSelected: "Fintech",
    sectorActual: "Fintech",
    stage: "Pre-seed",
    raiseCr: 1.8,
    postMoneyCr: 12,
    incorporated: "May 2026",
    source: "Public form",
    founders: [
      { name: "Sameer Qureshi", role: "CEO", background: "4 yrs PM at a fintech; launched two payments features" },
      { name: "Divya Menon", role: "Growth", background: "5 yrs consumer marketing; full-time since Aug 2026" },
    ],
    headline: [
      { label: "Rent volume", value: "₹6.1 Cr" },
      { label: "Net revenue", value: "₹5.5 L" },
      { label: "Paid ≥ once", value: "1,100" },
      { label: "PA partners", value: "1" },
    ],
    tags: ["fintech", "payments", "regulatory-dependent", "payments-partner", "consumer"],
    summary:
      "The deck claims no competitors in a category that PhonePe, Paytm and CRED all ran and then shut down when RBI tightened payment-aggregator rules. The business exists at the regulator's and card networks' discretion — the Coinlane pattern. Lean pass, on category.",
    assessments: [
      {
        criterion: "founder_market",
        score: 5,
        rationale: "Relevant payments PM experience; no risk, compliance or banking-partnership background, and engineering is contracted.",
        evidence: [
          { claim: "CEO 4 yrs fintech PM; Growth lead 5 yrs consumer marketing", source: [D(9), F("Founders")], verification: "consistent" },
          { claim: "Engineering by contract developers", source: [D(9), F("Team size")], verification: "consistent" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 3,
        rationale: "The form admits rule changes would 'hit us directly' but offers no plan for that scenario. The deck says there are no competitors.",
        evidence: [
          { claim: "\"Banks and card networks have changed rules on rent payments before, and a change would hit us directly\"", source: [F("Dependencies")], verification: "claimed" },
          { claim: "\"We have no direct competitors\"", source: [D(7)], verification: "contradicted" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 4,
        rationale: "Deck presents ₹11 L gross fees as revenue; the form shows net is half. Cost per paying user unmeasured.",
        evidence: [
          { claim: "Deck: 'INR 11 L revenue (1.8% fee)'. Form: net ₹5.5 L after 0.9% to the payment partner", source: [D(5), F("Revenue")], verification: "contradicted" },
          { claim: "₹6.1 Cr × 1.8% = ₹11 L gross; × 0.9% = ₹5.5 L net", source: [X("volume × take rate")], verification: "consistent" },
          { claim: "1,100 of 1,900 users have paid at least once", source: [F("Users")], verification: "claimed" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 3,
        rationale: "Organic demand is real, but the product runs on one payment aggregator under rules that forced the largest apps out.",
        evidence: [
          { claim: "Single payment aggregator partner", source: [F("Dependencies")], verification: "claimed" },
          { claim: "PhonePe, Paytm and CRED halted credit-card rent payments after RBI tightened PA rules (2025)", source: [WEB.rentHalt, WEB.rentHaltBS], verification: "external" },
        ],
      },
      {
        criterion: "capital_fit",
        score: 7,
        rationale: "₹1.8 Cr at ₹12 Cr post; capital-light.",
        evidence: [{ claim: "Raising ₹1.8 Cr; founders put in ₹18 L", source: [F("Fundraising")], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 2,
        rationale: "Rewards arbitrage with no moat; incumbents can relaunch compliant versions with their distribution.",
        evidence: [{ claim: "Reports of PhonePe and CRED preparing a compliant return", source: [WEB.rentHalt], verification: "external" }],
      },
      {
        criterion: "thesis_fit",
        score: 2,
        statedScore: 7,
        rationale: "Fintech by label. Revealed: existence depends on a favourable regulatory stance — anti-thesis per Coinlane.",
        evidence: [{ claim: "Coinlane memo: 'a business whose existence depends on a favourable regulatory change'", source: [M("Coinlane")], verification: "external" }],
      },
    ],
    flags: [
      { severity: "high", title: "'No direct competitors' is false", detail: "Major payment apps offered card rent payments and withdrew under regulation.", source: [D(7), WEB.rentHalt] },
      { severity: "high", title: "Regulatory existence risk", detail: "RBI payment-aggregator rules require a direct relationship with the merchant (landlord); this is why incumbents exited.", source: [WEB.rentHaltBS] },
      { severity: "medium", title: "Gross fees shown as revenue", detail: "Deck ₹11 L vs net ₹5.5 L.", source: [D(5), F("Revenue")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Sameer Qureshi and Divya Menon"),
      { what: "How landlord KYC is handled under current PA rules", tried: "Not addressed in deck or form.", cost: "Cannot tell whether the product is compliant today." },
    ],
    gates: [
      { kind: "anti_thesis", hard: true, title: "Existence depends on regulatory tolerance", detail: "Same category logic as Coinlane: no founder quality changes it.", source: [M("Coinlane"), WEB.rentHaltBS] },
    ],
    precedents: [{ memoId: "coinlane", why: "Real growth, but the business depends on regulators staying friendly — declined on category." }],
    callQuestions: [],
    wouldChangeView: ["A model that survives the PA rules (direct landlord KYC at low cost)", "Revenue that doesn't depend on card-reward arbitrage"],
  },

  // ───────────────────────────────────────────────────────────── 9. Settlr
  {
    id: "settlr",
    name: "Settlr",
    oneLiner: "Payments and invoice financing for Indian SMEs",
    city: "Mumbai",
    sectorSelected: "Fintech",
    sectorActual: "Fintech",
    stage: "Series A",
    raiseCr: 30,
    postMoneyCr: 180,
    incorporated: "Apr 2023",
    source: "Public form",
    founders: [
      { name: "Rahul Mehta", role: "CEO", background: "10 yrs transaction banking; led SME product at a private bank" },
      { name: "Sonal Iyer", role: "CTO", background: "8 yrs payments engineering at a large fintech" },
    ],
    headline: [
      { label: "Monthly TPV", value: "₹86 Cr" },
      { label: "Net revenue", value: "₹78 L/mo" },
      { label: "NRR", value: "112%" },
      { label: "Round", value: "₹30 Cr Series A" },
    ],
    tags: ["fintech", "payments", "lending", "smb", "series-a"],
    summary:
      "A strong company at the wrong stage. ₹30 Cr Series A looking for a lead is six times the fund's largest first cheque. Out of mandate — send a warm note and, if useful, introductions to Series A funds.",
    assessments: [
      { criterion: "founder_market", score: 8, rationale: "Ex-SME banking product lead + payments engineer.", evidence: [{ claim: "CEO 10 yrs transaction banking; CTO 8 yrs payments engineering", source: [D(9), F("Founders")], verification: "consistent" }] },
      { criterion: "risk_ownership", score: 7, rationale: "Names credit losses, NBFC dependence and digital-lending regulation; risk & compliance are a named use of funds.", evidence: [{ claim: "Key risks: credit losses, NBFC dependence, regulation", source: [F("Key risks")], verification: "claimed" }] },
      { criterion: "metric_fluency", score: 8, rationale: "CAC, payback, GM and NRR all present and consistent.", evidence: [{ claim: "CAC ₹14,500, payback 7 months, GM 58%, NRR 112%", source: [D(7), F("Unit economics")], verification: "consistent" }] },
      { criterion: "path_to_market", score: 8, rationale: "1,150 SMEs; CA/accountant partner channel.", evidence: [{ claim: "Channels: CA partners 40%, direct 35%, inbound 25%", source: [D(7), F("Customer acquisition")], verification: "consistent" }] },
      { criterion: "capital_fit", score: 1, rationale: "₹30 Cr at ₹180 Cr post, seeking a lead. The fund's first cheques top out at ₹5 Cr.", evidence: [{ claim: "Raising ₹30 Cr Series A; wants a lead investor", source: [F("Fundraising"), F("Anything else")], verification: "claimed" }, { claim: "Fund II first cheques up to ₹5 Cr", source: [WEB.isnFund2], verification: "external" }] },
      { criterion: "defensibility", score: 6, rationale: "Distribution through CAs and data from collections; contested category.", evidence: [{ claim: "Average SME pays ₹6,800/month", source: [D(7)], verification: "claimed" }] },
      { criterion: "thesis_fit", score: 3, statedScore: 4, rationale: "Fintech, but Series A.", evidence: [{ claim: "Stage selected: Series A", source: [F("Stage")], verification: "claimed" }] },
    ],
    flags: [{ severity: "info", title: "Strong metrics, wrong stage", detail: "Worth a relationship note; not a pre-seed investment.", source: [F("Stage")] }],
    gaps: [FOUNDER_WEB_GAP("Rahul Mehta and Sonal Iyer")],
    gates: [{ kind: "stage_mandate", hard: true, title: "Series A, ₹30 Cr — above the ₹5 Cr first-cheque ceiling", detail: "Pre-seed fund; would be a small participant in someone else's round.", source: [WEB.isnFund2, F("Fundraising")] }],
    precedents: [{ memoId: "hopbox", why: "'Not the small cheque that gets diluted once larger funds set the terms.'" }],
    callQuestions: [],
    wouldChangeView: ["Not applicable at this stage"],
  },

  // ───────────────────────────────────────────────────────────── 10. Yatrika
  {
    id: "yatrika",
    name: "Yatrika",
    oneLiner: "Family trips planned by AI, led by locals",
    city: "Jaipur",
    sectorSelected: "Consumer tech",
    sectorActual: "Travel",
    stage: "Pre-seed",
    raiseCr: 1.2,
    postMoneyCr: 8,
    incorporated: "Mar 2026",
    source: "Public form",
    founders: [
      { name: "Manish Joshi", role: "Founder", background: "10 yrs running his family's travel agency in Jaipur; 3,000+ families" },
      { name: "Kavya Nair", role: "Co-founder (Tech)", background: "3 yrs web developer" },
    ],
    headline: [
      { label: "Bookings", value: "410" },
      { label: "Revenue", value: "₹4.6 L" },
      { label: "Repeat", value: "14%" },
      { label: "Deck numbers", value: "0" },
    ],
    tags: ["consumer-tech", "travel", "manual-first", "ai", "services"],
    summary:
      "A real operator with a decade of customers — and a deck with no numbers, no ask and adjectives in place of data ('thousands', '3x', 'many 5-star reviews'). The form fills some gaps. Missing numbers drag the score; lean pass with a clear note on what to send.",
    assessments: [
      {
        criterion: "founder_market",
        score: 6,
        rationale: "Ten years serving 3,000 families is real distribution and an earned secret. Tech co-founder is junior for an 'AI' product.",
        evidence: [
          { claim: "10 yrs running family travel agency; 3,000+ families", source: [D(3), F("Founder 1")], verification: "consistent" },
          { claim: "Co-founder: 3 yrs web developer", source: [D(3), F("Founder 2")], verification: "consistent" },
          { claim: "Founder histories could not be checked publicly", source: [LI], verification: "unverifiable" },
        ],
      },
      {
        criterion: "risk_ownership",
        score: 3,
        rationale: "Risks appear only in the form (partners, seasonality, manual ops). The deck replaces evidence with enthusiasm.",
        evidence: [
          { claim: "Deck: 'thousands of travellers', '3x growth', 'many 5-star reviews' — no figures", source: [D(4)], verification: "contradicted" },
          { claim: "Form: ~1,300 travellers across 410 bookings", source: [F("Customers")], verification: "claimed" },
        ],
      },
      {
        criterion: "metric_fluency",
        score: 3,
        rationale: "Deck has no numbers and no ask. Form gives GMV, take rate and repeat, but not contribution per trip.",
        evidence: [
          { claim: "Booking value ₹38.6 L × 12% = ₹4.6 L revenue", source: [F("Revenue"), X("GMV × commission")], verification: "consistent" },
          { claim: "14% of families booked a second trip", source: [F("Repeat")], verification: "claimed" },
          { claim: "Paid acquisition ~₹640 per booking vs ~₹1,130 revenue per booking", source: [F("Customer acquisition"), X("₹4.6 L / 410")], verification: "consistent" },
          { claim: "Deck 'The ask' slide gives no amount", source: [D(5)], verification: "unverifiable" },
        ],
      },
      {
        criterion: "path_to_market",
        score: 5,
        rationale: "Referrals from the agency's base work; WhatsApp-manual confirmation doesn't scale.",
        evidence: [{ claim: "Bookings confirmed manually on WhatsApp; 40 hand-built route templates", source: [F("What have you built?")], verification: "claimed" }],
      },
      {
        criterion: "capital_fit",
        score: 7,
        rationale: "₹1.2 Cr at ₹8 Cr (form only) is small and capital-light.",
        evidence: [{ claim: "Raising ₹1.2 Cr at ₹8 Cr post", source: [F("Fundraising")], verification: "claimed" }],
      },
      {
        criterion: "defensibility",
        score: 3,
        rationale: "LLM + templates is easy to copy; vetted local partners are the only asset and aren't described.",
        evidence: [{ claim: "Itinerary from a language model and 40 route templates", source: [F("What have you built?")], verification: "claimed" }],
      },
      {
        criterion: "thesis_fit",
        score: 5,
        statedScore: 6,
        rationale: "Consumer tech by label; really a tech-assisted travel agency.",
        evidence: [{ claim: "Sector selected: Consumer tech", source: [F("Sector")], verification: "claimed" }],
      },
    ],
    flags: [
      { severity: "high", title: "Deck has no numbers and no ask", detail: "Traction slide uses adjectives; ask slide has no amount. The 'Our vision' slide appears twice.", source: [D(4), D(5), D(7), D(9)] },
      { severity: "medium", title: "'Thousands of travellers' vs ~1,300", detail: "Form figure is the specific one.", source: [D(4), F("Customers")] },
    ],
    gaps: [
      FOUNDER_WEB_GAP("Manish Joshi and Kavya Nair"),
      { what: "Contribution per trip after guide/taxi/stay costs", tried: "Not given.", cost: "Can't tell if bookings make money." },
      { what: "What '3x growth' measures", tried: "Not defined anywhere.", cost: "Growth cannot be assessed." },
    ],
    gates: [],
    precedents: [{ memoId: "prepnest", why: "Real audience, product tied to one person, retention not shown." }],
    callQuestions: [],
    wouldChangeView: ["Monthly bookings and contribution per trip for 6 months", "Repeat rate by cohort", "How much of planning is automated vs manual"],
  },
];

export const APP = Object.fromEntries(APPLICATIONS.map((a) => [a.id, a])) as Record<string, Application>;
