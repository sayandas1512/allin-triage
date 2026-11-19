import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 30;

/**
 * Weekly partner digest — "I'll still see every applicant's outcome before anything is decided."
 * The browser sends structured desk data; the server renders and sends it ONLY to the configured
 * partner inbox (DIGEST_RECIPIENT, else EMAIL_TEST_RECIPIENT). It can never be pointed elsewhere.
 */

const item = z.object({ name: z.string().max(80), id: z.string().max(80), score: z.number(), line: z.string().max(400) });
const schema = z.object({
  week: z.string().max(60),
  origin: z.string().max(200),
  rubric: z.string().max(120),
  trust: z.string().max(200),
  lanes: z
    .array(z.object({ title: z.string().max(60), tone: z.string().max(20), items: z.array(item).max(40) }))
    .max(6),
  waiting: z.array(z.object({ name: z.string().max(80), id: z.string().max(80), what: z.string().max(300) })).max(40),
  outreach: z.array(z.string().max(200)).max(40),
});

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const TONE: Record<string, string> = { go: "#1f9d63", review: "#b8860b", hold: "#7c5cd6", mandate: "#3b6fd4", pass: "#c0503f" };

export async function POST(req: Request) {
  const limited = rateLimit(req, "digest");
  if (limited) return limited;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid digest payload" }, { status: 400 });
  const d = parsed.data;

  const key = process.env.RESEND_API_KEY;
  const to = process.env.DIGEST_RECIPIENT ?? process.env.EMAIL_TEST_RECIPIENT;
  if (!key || !to) return Response.json({ delivery: "simulated", note: "No RESEND_API_KEY / recipient configured — digest not sent." });
  // only ever an http(s) origin we render as text links
  const origin = /^https?:\/\/[\w.:-]+$/.test(d.origin) ? d.origin : "";
  const link = (id: string, name: string) => (origin ? `<a href="${origin}/applications/${encodeURIComponent(id)}" style="color:#111;font-weight:600">${esc(name)}</a>` : `<b>${esc(name)}</b>`);

  const lanes = d.lanes
    .filter((l) => l.items.length)
    .map(
      (l) => `<h3 style="margin:22px 0 6px;font:600 13px -apple-system,Segoe UI,sans-serif;color:${TONE[l.tone] ?? "#333"};text-transform:uppercase;letter-spacing:.06em">${esc(l.title)} · ${l.items.length}</h3>
${l.items.map((i) => `<p style="margin:0 0 8px">${link(i.id, i.name)} <span style="color:#888">${i.score.toFixed(1)}</span><br><span style="color:#444">${esc(i.line)}</span></p>`).join("\n")}`,
    )
    .join("\n");
  const waiting = d.waiting.length
    ? `<h3 style="margin:22px 0 6px;font:600 13px sans-serif;text-transform:uppercase;letter-spacing:.06em">Waiting on you · ${d.waiting.length}</h3><ul style="padding-left:18px;margin:0">${d.waiting.map((w) => `<li style="margin-bottom:4px">${link(w.id, w.name)} — ${esc(w.what)}</li>`).join("")}</ul>`
    : `<p style="color:#1f9d63">Nothing is waiting on a partner.</p>`;
  const outreach = d.outreach.length
    ? `<h3 style="margin:22px 0 6px;font:600 13px sans-serif;text-transform:uppercase;letter-spacing:.06em">Calls & outreach</h3><ul style="padding-left:18px;margin:0">${d.outreach.map((o) => `<li>${esc(o)}</li>`).join("")}</ul>`
    : "";

  const html = `<div style="max-width:640px;font:14px/1.55 -apple-system,Segoe UI,sans-serif;color:#111">
<p style="font:12px monospace;color:#888;border-left:3px solid #48d597;padding-left:8px">Triage Desk · weekly partner digest · ${esc(d.week)}</p>
<h2 style="font:400 26px Georgia,serif;margin:6px 0 4px">This week's pile, already read.</h2>
<p style="color:#666;margin:0 0 4px">Scored with rubric ${esc(d.rubric)}. ${esc(d.trust)}</p>
<p style="color:#666;margin:0">The desk recommends; partners decide. Nothing has been sent to any founder without approval.</p>
${waiting}
${lanes}
${outreach}
${origin ? `<p style="margin-top:26px"><a href="${origin}/pipeline" style="background:#48d597;color:#04110a;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:600">Open the pipeline</a></p>` : ""}
</div>`;
  const text = `Triage Desk — weekly digest (${d.week})\nRubric ${d.rubric}. ${d.trust}\n\nWAITING ON YOU\n${d.waiting.map((w) => `- ${w.name}: ${w.what}`).join("\n") || "- nothing"}\n\n${d.lanes
    .filter((l) => l.items.length)
    .map((l) => `${l.title.toUpperCase()}\n${l.items.map((i) => `- ${i.name} (${i.score.toFixed(1)}): ${i.line}`).join("\n")}`)
    .join("\n\n")}`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "All In Capital Triage <onboarding@resend.dev>",
      to: [to],
      subject: `Triage digest · ${d.week} · ${d.waiting.length} waiting on you`,
      html,
      text,
    }),
  }).catch((e: unknown) => e as Error);
  if (res instanceof Error) return Response.json({ delivery: "failed", note: res.message });
  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) return Response.json({ delivery: "failed", note: `Resend ${res.status}: ${json.message ?? "error"}` });
  return Response.json({ delivery: "sent", id: json.id, note: "Digest sent to the partner inbox" });
}
