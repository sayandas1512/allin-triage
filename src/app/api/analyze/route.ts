import { generateText, Output } from "ai";
import { applicationSchema } from "@/lib/schema";
import { ANTI_THESIS, CRITERIA, PARTNER_RULES, PORTFOLIO, STATED_THESIS } from "@/lib/thesis";
import { MEMOS } from "@/lib/memos";
import { pickModel } from "@/lib/model";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 300;

interface WebSource {
  title: string;
  url: string;
}

/**
 * Whiteboard "Collect Info ← Free Source / Scrape".
 * Gemini with Google Search grounding researches what the deck doesn't say:
 * founders' public footprint, competitors, regulation, and any overlap with the portfolio.
 */
async function research(picked: NonNullable<ReturnType<typeof pickModel>>, deck: string, form: string) {
  if (!picked.google) return null;
  const { text, sources } = await generateText({
    model: picked.model,
    tools: { google_search: picked.google.tools.googleSearch({}) },
    prompt: `You are researching an inbound pre-seed application for All In Capital (Mumbai VC). Use Google Search.
Find, with sources: (1) any public footprint of the company and each founder (note if links are placeholders or nothing is found),
(2) the main competitors in India and how funded they are, (3) any regulation that could make or break the business,
(4) whether it overlaps with any of these portfolio companies: ${PORTFOLIO.map((p) => `${p.name} (${p.what})`).join("; ")}.
Write terse bullet notes. Say plainly when you could not find something. Do not repeat the deck.

DECK:
${deck.slice(0, 12_000)}

FORM:
${form.slice(0, 12_000)}`,
  });
  const web: WebSource[] = [];
  for (const s of sources ?? []) {
    if (s.sourceType === "url" && !web.some((w) => w.url === s.url)) web.push({ title: s.title ?? new URL(s.url).hostname, url: s.url });
  }
  return { notes: text, sources: web.slice(0, 12) };
}

function systemPrompt(webSources: WebSource[] | null) {
  return `You are the first-pass triage analyst for All In Capital, a Mumbai pre-seed fund. You make the case and show your work; you never decide.

STATED THESIS (public sources):
${STATED_THESIS.map((s) => `- ${s.k}: ${s.v}`).join("\n")}

SEVEN CRITERIA (score each 0–10; null only if there is no evidence at all):
${CRITERIA.map((c) => `- ${c.id} — ${c.name}: ${c.question} ${c.definition}${c.sectorMetric ? ` Deciding metric by sector: ${Object.entries(c.sectorMetric).map(([k, v]) => `${k}: ${v}`).join("; ")}.` : ""}`).join("\n")}
For thesis_fit, give "score" under the revealed thesis and "statedScore" under the stated thesis.

PARTNER RULES:
${PARTNER_RULES.map((r) => `- ${r.rule}`).join("\n")}

INFERRED ANTI-THESIS:
${ANTI_THESIS.map((a) => `- ${a.rule} (${a.from})`).join("\n")}

PORTFOLIO (check every application for overlap; a plausible overlap is a hard "portfolio_conflict" gate — a false alarm beats a miss):
${PORTFOLIO.map((p) => `- ${p.name}: ${p.what}`).join("\n")}

SCORING SCALE (calibrate every criterion to this; the same scale scored the fund's 12 past decisions below):
- 9–10: exceptional, specific evidence that would be best-in-batch (e.g. GIVA metric fluency 9: cohort repeat and margin known by heart).
- 7–8: strong, specific and internally consistent evidence with minor gaps (most credible founder teams with real traction land here).
- 5–6: mixed — real but thin, partly inconsistent, or the key number is estimated.
- 3–4: weak — the deciding evidence is missing, or one material contradiction.
- 0–2: failing — misrepresentation, or the founder disowns the core risk (CampusCredit risk ownership 1).
- Self-reported but consistent numbers are scored on their merits (usually 5–8). Do NOT lower a score just because founder links are placeholders or claims are unaudited — record that as a gap and as "claimed"/"unverifiable" verification; the engine lowers CONFIDENCE for it, not the score.
- capital_fit and thesis_fit judge structure and mandate only, not founder quality.
CALIBRATION ANCHORS — the fund's past decisions on this scale (founder_market, risk_ownership, metric_fluency, path_to_market, capital_fit, defensibility, thesis_fit revealed/stated):
${MEMOS.map((m) => `- ${m.name} (${m.decision}): ${m.scores.founder_market}, ${m.scores.risk_ownership}, ${m.scores.metric_fluency}, ${m.scores.path_to_market}, ${m.scores.capital_fit}, ${m.scores.defensibility}, ${m.scores.thesis_fit}/${m.scores.thesis_fit_stated}`).join("\n")}

PAST DECISIONS (use ids for precedents):
${MEMOS.map((m) => `- ${m.id} (${m.name}, ${m.decision}): ${m.reason}`).join("\n")}

RULES FOR EVIDENCE:
- Every claim needs at least one source: deck slide number, form field name, or "Arithmetic · ..." for checks you computed.
- Compare the deck with the form line by line. Any disagreement (counts, revenue, credentials, who funds what) is "contradicted" and becomes a flag.
- Recompute any arithmetic you can (seats × price, GMV × take rate, CAC = cost / customers). Mismatches are contradictions.
${
    webSources
      ? `- WEB RESEARCH notes are provided below with a numbered source list. When you use a public fact, cite it as a source with kind "web", ref "<site title>" and url copied exactly from the list. Use verification "external". Never cite a URL that is not in the list.`
      : `- You have no web access in this run. Do not invent public facts. Add a gap: "Public web research not run for this intake", with what it costs.`
  }
- Founder links on placeholder domains are unverifiable; say so in a gap.
- Stage above pre-seed/seed or a round far above ₹5 Cr is a hard "stage_mandate" gate. Sectors outside the four stated ones are a soft "sector_outside" gate.
- Be specific and terse. No adjectives without numbers.`;
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "analyze");
  if (limited) return limited;
  const picked = pickModel();
  if (!picked) {
    return Response.json(
      {
        error:
          "Live analysis needs a model key. Add GOOGLE_GENERATIVE_AI_API_KEY (free from Google AI Studio) or AI_GATEWAY_API_KEY to .env.local and restart the dev server.",
      },
      { status: 501 },
    );
  }
  let body: { deck?: string; form?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const deck = (body.deck ?? "").slice(0, 40_000);
  const form = (body.form ?? "").slice(0, 40_000);
  if (deck.trim().length < 40 && form.trim().length < 40) {
    return Response.json({ error: "Paste the deck text and/or the form response." }, { status: 400 });
  }

  try {
    let web: Awaited<ReturnType<typeof research>> = null;
    let researchError: string | null = null;
    try {
      web = await research(picked, deck, form);
    } catch (e) {
      researchError = e instanceof Error ? e.message.slice(0, 160) : "unknown";
    }
    const webBlock = web
      ? `\n\nWEB RESEARCH NOTES:\n${web.notes}\n\nWEB SOURCES:\n${web.sources.map((w, i) => `[${i + 1}] ${w.title} — ${w.url}`).join("\n")}`
      : "";
    const { output } = await generateText({
      model: picked.model,
      system: systemPrompt(web ? web.sources : null),
      output: Output.object({ schema: applicationSchema }),
      prompt: `DECK TEXT:\n"""\n${deck}\n"""\n\nFORM RESPONSE:\n"""\n${form}\n"""${webBlock}\n\nProduce the structured assessment.`,
    });
    // Guardrail: drop any web citation whose URL the research step didn't actually return.
    const allowed = new Set(web?.sources.map((w) => w.url) ?? []);
    const clean = <T extends { source: { kind: string; url?: string }[] }>(x: T): T => ({
      ...x,
      source: x.source.filter((s) => s.kind !== "web" || !s.url || allowed.has(s.url)),
    });
    const app = {
      ...output,
      assessments: output.assessments.map((a) => ({ ...a, evidence: a.evidence.map(clean).filter((e) => e.source.length > 0) })),
      flags: output.flags.map(clean),
      gates: output.gates.map(clean),
      research: web ? { notes: web.notes, sources: web.sources, model: picked.label } : { notes: researchError ? `Web research failed: ${researchError}` : "Web research not available for this model provider.", sources: [], model: picked.label },
    };
    const id = `${output.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36).slice(-4)}`;
    return Response.json({ application: { ...app, id }, model: picked.label });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: `Analysis failed: ${msg}` }, { status: 502 });
  }
}
