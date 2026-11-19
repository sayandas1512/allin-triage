import { z } from "zod";

const source = z.object({
  kind: z.enum(["deck", "form", "web", "memo", "notes", "derived"]),
  ref: z.string().describe("Locator, e.g. 'Deck · slide 5' or 'Form · Customers' or 'Arithmetic · seats × price'"),
  url: z.string().optional(),
});

const evidence = z.object({
  claim: z.string(),
  source: z.array(source).min(1),
  verification: z.enum(["claimed", "consistent", "contradicted", "external", "unverifiable"]),
});

const criterionId = z.enum(["founder_market", "risk_ownership", "metric_fluency", "path_to_market", "capital_fit", "defensibility", "thesis_fit"]);

export const applicationSchema = z.object({
  name: z.string(),
  oneLiner: z.string(),
  city: z.string(),
  sectorSelected: z.string(),
  sectorActual: z.enum(["Fintech", "Deeptech", "Consumer tech", "Consumer brands", "B2B SaaS", "Healthcare", "Travel"]),
  stage: z.string(),
  raiseCr: z.number().nullable(),
  postMoneyCr: z.number().nullable(),
  incorporated: z.string(),
  source: z.enum(["Public form", "Warm intro (Fund I founder)"]),
  founders: z.array(z.object({ name: z.string(), role: z.string(), background: z.string() })),
  headline: z.array(z.object({ label: z.string(), value: z.string() })).max(4),
  tags: z.array(z.string()).describe("4–6 lowercase kebab-case tags describing business model and risk, e.g. lending, hardware, consumer-brand, b2b-saas"),
  assessments: z
    .array(
      z.object({
        criterion: criterionId,
        score: z.number().min(0).max(10).nullable().describe("null if no evidence at all — the engine imputes a drag"),
        statedScore: z.number().min(0).max(10).optional().describe("thesis_fit only: score under the stated (public) thesis"),
        rationale: z.string(),
        evidence: z.array(evidence),
      }),
    )
    .length(7),
  flags: z.array(z.object({ severity: z.enum(["critical", "high", "medium", "info"]), title: z.string(), detail: z.string(), source: z.array(source) })),
  gaps: z.array(z.object({ what: z.string(), tried: z.string(), cost: z.string() })),
  gates: z.array(
    z.object({
      kind: z.enum(["portfolio_conflict", "stage_mandate", "anti_thesis", "sector_outside"]),
      hard: z.boolean(),
      title: z.string(),
      detail: z.string(),
      source: z.array(source),
    }),
  ),
  precedents: z.array(z.object({ memoId: z.string(), why: z.string() })).max(3),
  callQuestions: z.array(z.string()).max(4),
  wouldChangeView: z.array(z.string()).max(3),
  summary: z.string().describe("Two to three sentences for the partners"),
});

export type AnalyzedApplication = z.infer<typeof applicationSchema>;
