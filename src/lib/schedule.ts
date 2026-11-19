import type { Application } from "./types";

export interface Slot {
  /** ISO date-time in IST, e.g. 2026-11-19T14:00:00+05:30 */
  start: string;
  label: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Meeting 5: "Tuesday or Thursday afternoons, 30 minutes."
 * Generates IST slots from 14:00 to 17:30 for the next `weeks` weeks, starting tomorrow.
 */
export function generateSlots(from: Date, weeks = 2): Slot[] {
  const slots: Slot[] = [];
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  for (let i = 1; i <= weeks * 7; i++) {
    const day = new Date(d.getTime() + i * 86400000);
    const dow = day.getUTCDay();
    if (dow !== 2 && dow !== 4) continue;
    for (const [h, m] of [[14, 0], [14, 30], [15, 0], [15, 30], [16, 0], [16, 30], [17, 0]]) {
      const ymd = `${day.getUTCFullYear()}-${pad(day.getUTCMonth() + 1)}-${pad(day.getUTCDate())}`;
      slots.push({
        start: `${ymd}T${pad(h)}:${pad(m)}:00+05:30`,
        label: `${DAY[dow]} ${day.getUTCDate()} ${MON[day.getUTCMonth()]} · ${pad(h)}:${pad(m)} IST`,
      });
    }
  }
  return slots;
}

export function attendeesFor(app: Application) {
  if (app.sectorActual === "Deeptech") {
    return { lead: "Kushal", others: ["Aditya"], note: "Deeptech: Aditya joins; partners run the second call themselves (Meeting 3)." };
  }
  return { lead: "Riya", others: ["Kushal (optional)"], note: "Fintech/consumer: Riya runs the first screen (Meeting 3)." };
}

function icsDate(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
}

export function buildICS(app: Application, slot: Slot) {
  const start = new Date(slot.start);
  const end = new Date(start.getTime() + 30 * 60000);
  const a = attendeesFor(app);
  const desc = [
    `All In Capital × ${app.name} — first call (30 min).`,
    `Lead: ${a.lead}. ${a.others.join(", ")}.`,
    "",
    "Questions we want answered:",
    ...app.callQuestions.map((q, i) => `${i + 1}. ${q}`),
  ].join("\\n");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//All In Capital//Triage Desk//EN",
    "BEGIN:VEVENT",
    `UID:${app.id}-${start.getTime()}@allin-triage`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(slot.start)}`,
    `DTEND:${icsDate(end.toISOString())}`,
    `SUMMARY:All In Capital × ${app.name}`,
    `DESCRIPTION:${desc}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function inviteEmail(app: Application, slot: Slot) {
  const first = app.founders[0]?.name.split(" ")[0] ?? "there";
  const a = attendeesFor(app);
  return `Hi ${first},

Thanks for sending ${app.name} to All In Capital. We'd like to set up a 30-minute call.

Proposed: ${slot.label}. If that doesn't work, reply with any Tuesday or Thursday afternoon and we'll move it.

You'll be speaking with ${a.lead}${a.others.length ? ` and ${a.others.map((o) => o.replace(" (optional)", "")).join(", ")}` : ""}. A few things we'd like to cover:
${app.callQuestions.map((q) => `• ${q}`).join("\n")}

Best,
All In Capital`;
}

export function passNote(app: Application) {
  const first = app.founders[0]?.name.split(" ")[0] ?? "there";
  return `Hi ${first},

Thank you for sending ${app.name} through. We've read the deck and form carefully and we're going to pass at this stage.

To be direct about why, and what would change our view:
${app.wouldChangeView.map((w) => `• ${w}`).join("\n")}

If you get there, please come back to us — we'd be glad to take another look.

Best,
All In Capital`;
}
