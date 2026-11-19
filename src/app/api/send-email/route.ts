import { rateLimit } from "@/lib/ratelimit";
/**
 * Whiteboard "Send Email". Delivers outbox messages through Resend's REST API.
 *
 * Safety: founders in this case are fictional (.example addresses), and a Resend account without
 * a verified domain can only deliver to its owner's inbox. So every email is redirected to
 * EMAIL_TEST_RECIPIENT, with the intended recipient shown at the top. Set EMAIL_LIVE_RECIPIENTS=true
 * (after verifying a domain and setting EMAIL_FROM) to deliver to real founders.
 *
 * With no RESEND_API_KEY the route reports "simulated" and the app keeps working.
 */

export const maxDuration = 30;

interface Body {
  to: string;
  subject: string;
  body: string;
  ics?: { filename: string; content: string };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(req: Request) {
  const limited = rateLimit(req, "email");
  if (limited) return limited;
  let b: Body;
  try {
    b = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!b.to || !b.subject || !b.body) return Response.json({ error: "to, subject and body are required" }, { status: 400 });
  if (b.subject.length > 200 || b.body.length > 8000 || (b.ics && b.ics.content.length > 20_000)) {
    return Response.json({ error: "Email too large" }, { status: 413 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return Response.json({ delivery: "simulated", note: "No RESEND_API_KEY — simulated send" });

  const live = process.env.EMAIL_LIVE_RECIPIENTS === "true";
  const testInbox = process.env.EMAIL_TEST_RECIPIENT;
  if (!live && !testInbox) {
    return Response.json({ delivery: "failed", note: "Set EMAIL_TEST_RECIPIENT (the inbox your Resend account was created with)." }, { status: 200 });
  }
  const to = live ? b.to : testInbox!;
  const banner = live ? "" : `[Test mode — intended for ${b.to}]\n\n`;
  const from = process.env.EMAIL_FROM ?? "All In Capital Triage <onboarding@resend.dev>";

  const payload: Record<string, unknown> = {
    from,
    to: [to],
    subject: live ? b.subject : `[TEST] ${b.subject}`,
    text: banner + b.body,
    html: `${banner ? `<p style="font:12px monospace;color:#888;border-left:3px solid #48d597;padding-left:8px">${esc(banner.trim())}</p>` : ""}<div style="font:14px/1.6 -apple-system,Segoe UI,sans-serif;white-space:pre-wrap">${esc(b.body)}</div>`,
  };
  if (b.ics) {
    payload.attachments = [{ filename: b.ics.filename, content: Buffer.from(b.ics.content, "utf8").toString("base64") }];
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok) return Response.json({ delivery: "failed", note: `Resend ${res.status}: ${json.message ?? json.name ?? "error"}` });
    return Response.json({ delivery: "sent", id: json.id, note: live ? `Sent to ${to}` : `Sent to test inbox (intended for ${b.to})` });
  } catch (e) {
    return Response.json({ delivery: "failed", note: `Network error: ${e instanceof Error ? e.message : "unknown"}` });
  }
}
