import { generateText, Output } from "ai";
import { z } from "zod";
import { pickModel } from "@/lib/model";
import { heuristicDecision, type AgentDecision } from "@/lib/outreach";
import type { Slot } from "@/lib/schedule";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

const decisionSchema = z.object({
  intent: z.enum(["accept", "decline", "propose_alternative", "question", "unclear"]),
  chosenSlot: z.string().nullable().describe("The exact `start` value of the slot to book, copied from OFFERED or FREE. null if none."),
  summary: z.string().describe("One sentence for the partners: what the founder said"),
  reply: z
    .object({ subject: z.string(), body: z.string() })
    .nullable()
    .describe("Reply to the founder. Required when intent is question or unclear (a draft for a partner to approve)."),
  needsHuman: z.boolean(),
  reason: z.string(),
});

interface Body {
  company: string;
  founder: string;
  offered: Slot[];
  free: Slot[];
  thread: { by: string; body: string }[];
  reply: string;
  /** ISO time on the (demo) clock, so relative dates like "next Tuesday" resolve */
  today?: string;
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "agent");
  if (limited) return limited;
  let b: Body;
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!b.reply?.trim()) return Response.json({ error: "Empty reply" }, { status: 400 });

  const picked = pickModel();
  if (!picked) return Response.json({ decision: heuristicDecision(b.reply, b.offered, b.free) });

  const system = `You are the meeting-booking agent for All In Capital, a pre-seed VC fund. You read a founder's email reply and decide the next step.
Rules:
- Calls are 30 minutes on Tuesday or Thursday afternoons (IST). You may only book a slot whose "start" appears in OFFERED or FREE below — never invent a time.
- accept: founder agreed to one of the OFFERED slots → chosenSlot = that slot's start.
- propose_alternative: founder suggested another time → if it matches a FREE slot, set chosenSlot to it; if it does not match any, chosenSlot = null and needsHuman = true with a reply draft offering the nearest free slots.
- decline: founder is not interested / not raising → chosenSlot null, needsHuman false.
- question or unclear: anything about terms, cheque size, valuation, diligence, or ambiguity → needsHuman = true, and write a short reply draft for a partner to approve. Never answer questions about money or terms yourself.
- Be brief and warm. Never promise investment.`;

  const today = b.today ? new Date(b.today) : new Date();
  const prompt = `TODAY: ${today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}
COMPANY: ${b.company}
FOUNDER: ${b.founder}
OFFERED: ${JSON.stringify(b.offered)}
FREE: ${JSON.stringify(b.free.slice(0, 20))}
THREAD SO FAR:
${b.thread.map((m) => `[${m.by}] ${m.body}`).join("\n---\n")}

NEW REPLY FROM FOUNDER:
"""${b.reply.slice(0, 4000)}"""`;

  try {
    const { output } = await generateText({ model: picked.model, system, prompt, output: Output.object({ schema: decisionSchema }) });
    // Guardrail: the model may only book a slot we actually offered or have free.
    const valid = new Set([...b.offered, ...b.free].map((s) => s.start));
    const safe: AgentDecision = { ...output, engine: picked.label };
    if (safe.chosenSlot && !valid.has(safe.chosenSlot)) {
      safe.chosenSlot = null;
      safe.needsHuman = true;
      safe.reason = `Model picked a slot that isn't free (${output.chosenSlot}); sent to a partner. ${safe.reason}`;
    }
    if ((safe.intent === "accept" || safe.intent === "propose_alternative") && !safe.chosenSlot) safe.needsHuman = true;
    return Response.json({ decision: safe });
  } catch (e) {
    const fallback = heuristicDecision(b.reply, b.offered, b.free);
    return Response.json({ decision: { ...fallback, reason: `Model error, used rules: ${e instanceof Error ? e.message.slice(0, 120) : "unknown"}` } });
  }
}
