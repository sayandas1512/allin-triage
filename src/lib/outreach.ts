import { attendeesFor, type Slot } from "./schedule";
import type { Application } from "./types";

/**
 * Outreach state machine — the right half of the whiteboard:
 *
 *   Final decision ─Go──▶ Draft email ─👤 approve──▶ Send ─▶ Booking agent ─┬─ Yes ─▶ Booked
 *                 └No──▶ Draft pass  ─👤 approve──▶ Send (done)             ├─ No  ─▶ Declined
 *                                                                           ├─ No reply x days ─▶ Follow-up (×N) ─▶ Closed
 *                                                                           └─ Question / unclear ─▶ 👤 review
 */
export type OutreachKind = "invite" | "pass";

export type OutreachStage =
  | "draft" // waiting for partner approval (HITL)
  | "awaiting_reply" // invite sent, agent watching the thread
  | "needs_human" // agent couldn't resolve a reply; partner must respond
  | "booked"
  | "declined"
  | "closed_no_response"
  | "pass_sent";

export type Author = "Kushal" | "Riya" | "Agent" | "Founder";

export interface Message {
  id: string;
  dir: "out" | "in";
  at: string; // ISO, on the (possibly advanced) demo clock
  by: Author;
  subject: string;
  body: string;
  /** How it left the building: simulated (no mail key), sending, sent via Resend, or failed. */
  delivery?: "simulated" | "sending" | "sent" | "failed";
  deliveryNote?: string;
  note?: string;
}

export interface Draft {
  to: string;
  subject: string;
  body: string;
}

export interface Outreach {
  appId: string;
  kind: OutreachKind;
  stage: OutreachStage;
  draft: Draft | null;
  offered: Slot[];
  messages: Message[];
  followUps: number;
  lastOutboundAt: string | null;
  booked?: Slot;
  /** Agent's latest read of the thread, shown to partners */
  agentNote?: string;
  /** Draft the agent prepared when it needs a human */
  pendingReply?: Draft;
}

export interface OutreachSettings {
  followUpDays: number;
  maxFollowUps: number;
}

export const DEFAULT_OUTREACH_SETTINGS: OutreachSettings = { followUpDays: 3, maxFollowUps: 2 };

export const STAGE_COPY: Record<OutreachStage, { label: string; tone: string }> = {
  draft: { label: "Draft · awaiting approval", tone: "review" },
  awaiting_reply: { label: "Sent · agent watching", tone: "mandate" },
  needs_human: { label: "Agent needs a partner", tone: "hold" },
  booked: { label: "Meeting booked", tone: "go" },
  declined: { label: "Founder declined", tone: "pass" },
  closed_no_response: { label: "Closed · no reply", tone: "pass" },
  pass_sent: { label: "Pass note sent", tone: "pass" },
};

export const msgId = () => `m${Math.random().toString(36).slice(2, 9)}`;

export function founderEmail(app: Application) {
  const f = app.founders[0]?.name.split(" ")[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "founder";
  return `${f}@${app.id.replace(/-[a-z0-9]{4}$/, "")}.example`;
}

const firstName = (app: Application) => app.founders[0]?.name.replace(/^Dr\.\s*/, "").split(" ")[0] ?? "there";

export function inviteDraft(app: Application, offered: Slot[]): Draft {
  const a = attendeesFor(app);
  const others = a.others.map((o) => o.replace(" (optional)", ""));
  return {
    to: founderEmail(app),
    subject: `All In Capital × ${app.name} — 30 minutes this week?`,
    body: `Hi ${firstName(app)},

Thanks for sending ${app.name} to All In Capital. We've read the deck and form and would like to talk.

Could you do 30 minutes at one of these times?
${offered.map((s) => `• ${s.label}`).join("\n")}

You'd be speaking with ${a.lead}${others.length ? ` and ${others.join(", ")}` : ""}. A few things we'd like to cover:
${app.callQuestions.map((q) => `• ${q}`).join("\n") || "• The business, in your words"}

Just reply with the slot that works, or suggest another Tuesday or Thursday afternoon.

Best,
All In Capital`,
  };
}

export function passDraft(app: Application): Draft {
  return {
    to: founderEmail(app),
    subject: `${app.name} × All In Capital`,
    body: `Hi ${firstName(app)},

Thank you for sending ${app.name} through. We've read the deck and form carefully and we're going to pass at this stage.

To be direct about why, and what would change our view:
${app.wouldChangeView.map((w) => `• ${w}`).join("\n") || "• Not a fit with our current mandate"}

If you get there, please come back to us — we'd be glad to take another look.

Best,
All In Capital`,
  };
}

export function followUpMessage(app: Application, o: Outreach, n: number): Pick<Message, "subject" | "body"> {
  return {
    subject: `Re: All In Capital × ${app.name}`,
    body:
      n === 1
        ? `Hi ${firstName(app)}, just floating this back up — would any of these work for a 30-minute call?\n${o.offered.map((s) => `• ${s.label}`).join("\n")}\n\nHappy to find another Tuesday or Thursday afternoon too.`
        : `Hi ${firstName(app)}, last nudge from our side. If now isn't the right time, no problem at all — reply whenever you're ready and we'll pick it up.`,
  };
}

export function confirmationMessage(app: Application, slot: Slot): Pick<Message, "subject" | "body"> {
  const a = attendeesFor(app);
  return {
    subject: `Confirmed: All In Capital × ${app.name} · ${slot.label}`,
    body: `Hi ${firstName(app)}, confirmed for ${slot.label} (30 min). Calendar invite attached. ${a.lead} will lead${a.others.length ? `, with ${a.others.map((o) => o.replace(" (optional)", "")).join(", ")}` : ""}. Speak then.`,
  };
}

export function declineAckMessage(app: Application): Pick<Message, "subject" | "body"> {
  return {
    subject: `Re: All In Capital × ${app.name}`,
    body: `Understood, ${firstName(app)} — thanks for letting us know. The door stays open; reach out whenever it makes sense.`,
  };
}

/** What the booking agent decided about one founder reply. Shared by the API and the offline fallback. */
export interface AgentDecision {
  intent: "accept" | "decline" | "propose_alternative" | "question" | "unclear";
  chosenSlot: string | null; // a Slot.start the agent selected
  summary: string;
  reply: { subject: string; body: string } | null;
  needsHuman: boolean;
  reason: string;
  engine: string;
}

/**
 * Offline fallback when no model key is configured: keyword rules.
 * Deliberately conservative — anything ambiguous goes to a human.
 */
export function heuristicDecision(reply: string, offered: Slot[], free: Slot[]): AgentDecision {
  const t = reply.toLowerCase();
  const base = { reply: null, engine: "rules (no model key)" };
  if (/\b(not interested|no thanks|pass|not raising|closed (the|our) round|decline)\b/.test(t)) {
    return { ...base, intent: "decline", chosenSlot: null, summary: "Founder declined.", needsHuman: false, reason: "Decline keywords" };
  }
  const days: Record<string, string> = { tue: "Tue", thu: "Thu" };
  const time = t.match(/\b(1[0-2]|[1-9])(?::(\d{2}))?\s*(pm|p\.m\.)?/);
  const day = Object.keys(days).find((d) => t.includes(d));
  if (day || time) {
    const hour = time ? (Number(time[1]) % 12) + 12 : null;
    const pool = [...offered, ...free];
    const pick = pool.find((s) => (!day || s.label.startsWith(days[day])) && (hour === null || s.start.includes(`T${String(hour).padStart(2, "0")}:${time?.[2] ?? "00"}`)));
    if (pick) {
      const isOffered = offered.some((o) => o.start === pick.start);
      return { ...base, intent: isOffered ? "accept" : "propose_alternative", chosenSlot: pick.start, summary: `Founder can do ${pick.label}.`, needsHuman: false, reason: "Matched day/time to a free slot" };
    }
  }
  if (/\b(works|sounds good|confirmed|yes|great)\b/.test(t) && offered[0]) {
    return { ...base, intent: "accept", chosenSlot: offered[0].start, summary: `Founder said yes; booked the first offered slot (${offered[0].label}).`, needsHuman: false, reason: "Generic yes" };
  }
  if (t.includes("?")) return { ...base, intent: "question", chosenSlot: null, summary: "Founder asked a question.", needsHuman: true, reason: "Questions go to a partner" };
  return { ...base, intent: "unclear", chosenSlot: null, summary: "Couldn't read the reply with confidence.", needsHuman: true, reason: "Ambiguous" };
}
