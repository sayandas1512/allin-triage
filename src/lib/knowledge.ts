import "server-only";
import { APPLICATIONS } from "./applications";
import { MEMOS } from "./memos";
import { ANTI_THESIS, CRITERIA, PARTNER_RULES, PORTFOLIO, STATED_THESIS } from "./thesis";
import type { Application } from "./types";

/**
 * Builds the read-only knowledge base the chat assistant answers from.
 * Static, trusted data (thesis, memos, the analysed batch) comes from the server;
 * the live desk state (scores under the active rubric, decisions, threads) comes from the
 * browser and is treated as untrusted data.
 */

const GUIDE = `PLATFORM GUIDE (how to do things — the assistant cannot do them itself)
- Desk (/): triage board by recommendation; lens toggle (revealed vs stated thesis) re-sorts it.
- Application page (/applications/<id>): 7-criterion scorecard with every claim's source, red flags, gaps, precedents. "Correct this score" saves a correction with a reason that carries over to similar companies.
- Final decision panel: Go / Hold / No. Go drafts an invite with 3 Tue/Thu slots; No drafts a pass note. Nothing is sent until a partner clicks "Approve & send".
- Booking agent: reads founder replies; books free slots, acknowledges declines, sends money/terms questions to a partner; auto follow-up after 3 days of silence (max 2), then closes.
- Pipeline (/pipeline): the whiteboard workflow and the "waiting on a human" inbox. Weekly digest email button.
- Rubric (/rubric): edit weights, thresholds, missing-data score; live backtest impact; save versions with a reason; re-activate any version.
- Backtest (/backtest): agreement with the 12 past decisions under pre-call / in-sample / stated tests, trust contract, where it breaks.
- Thesis (/thesis): stated vs revealed thesis, criteria, anti-thesis, partner rules, portfolio list.
- Memory (/memory): correction ledger; "Reset all local state".
- Intake (/intake): upload deck + form PDFs (batch) or paste text; Gemini + Google Search research; same engine scores it.
- Emails are real (Resend) but in test mode: redirected to the partners' test inbox.`;

function appBlock(a: Application) {
  const lines = [
    `## ${a.name} (id: ${a.id}) — ${a.oneLiner}`,
    `City ${a.city} · filed as ${a.sectorSelected}, scored as ${a.sectorActual} · ${a.stage} · raise ₹${a.raiseCr ?? "?"} Cr @ ₹${a.postMoneyCr ?? "?"} Cr post · ${a.source} · incorporated ${a.incorporated}`,
    `Founders: ${a.founders.map((f) => `${f.name} (${f.role}): ${f.background}`).join("; ")}`,
    `Summary: ${a.summary}`,
    ...a.assessments.map(
      (x) =>
        `- ${x.criterion}: ${x.score ?? "no evidence"}${x.statedScore !== undefined ? ` (stated lens ${x.statedScore})` : ""} — ${x.rationale}\n  evidence: ${x.evidence
          .map((e) => `"${e.claim}" [${e.verification}; ${e.source.map((s) => s.ref).join(" + ")}]`)
          .join(" | ")}`,
    ),
    a.gates.length ? `Gates: ${a.gates.map((g) => `${g.hard ? "HARD" : "soft"} ${g.kind}: ${g.title} — ${g.detail}`).join(" | ")}` : "Gates: none",
    `Red flags: ${a.flags.map((f) => `[${f.severity}] ${f.title}: ${f.detail}`).join(" | ") || "none"}`,
    `Gaps: ${a.gaps.map((g) => `${g.what} (cost: ${g.cost})`).join(" | ") || "none"}`,
    `Precedents: ${a.precedents.map((p) => `${p.memoId}: ${p.why}`).join(" | ") || "none"}`,
    a.callQuestions.length ? `Call questions: ${a.callQuestions.join(" | ")}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

let cached: string | null = null;

export function staticKnowledge() {
  if (cached) return cached;
  cached = [
    "# FUND: All In Capital (Mumbai pre-seed; partners Kushal Bhagia and Aditya Singh; associate Riya)",
    "## Stated thesis (public sources)",
    ...STATED_THESIS.map((s) => `- ${s.k}: ${s.v} [${s.src.map((x) => x.ref).join("; ")}]`),
    "## Seven criteria",
    ...CRITERIA.map((c) => `- ${c.id} — ${c.name}: ${c.question} ${c.definition}`),
    "## Inferred anti-thesis",
    ...ANTI_THESIS.map((a) => `- ${a.rule} (${a.from})`),
    "## Partner rules (from meeting notes)",
    ...PARTNER_RULES.map((r) => `- ${r.rule} (${r.who}; ${r.src.ref})`),
    "## Portfolio used for conflict checks (public, incomplete)",
    ...PORTFOLIO.map((p) => `- ${p.name}: ${p.what}`),
    "## Past decisions (12 deal memos)",
    ...MEMOS.map((m) => `- ${m.name} (${m.id}) — ${m.decision} — ${m.sector}, ${m.stage}, ${m.source}. ${m.what} Reason: ${m.reason}`),
    "## Backtest headline (baseline rubric)",
    "- Pre-call information: 9/12 agree, 0 hard misses (ePlane, Wint, SuperK go to partner review). In-sample: 12/12 (upper bound, circular). Stated thesis: 8/12 (lets Petalry, CampusCredit, AeroDrop, Prepnest through to review).",
    "- Limits: memo text is post-hoc; n=12; can't observe the room; founder links are placeholders; portfolio list is public/incomplete; most numbers self-reported.",
    "# THIS WEEK'S BATCH (analysed applications)",
    ...APPLICATIONS.map(appBlock),
    GUIDE,
  ].join("\n");
  return cached;
}

export { appBlock };
