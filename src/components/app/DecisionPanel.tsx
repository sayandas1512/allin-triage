"use client";

import { REC_COPY, type ScoreResult } from "@/lib/engine";
import { attendeesFor } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import type { Application, DecisionState } from "@/lib/types";
import { OutreachPanel } from "./OutreachPanel";

/**
 * Whiteboard: Recommendation → 👤 → Final decision ─Go─▶ Draft email (→ HITL → Send → Booking agent)
 *                                                  └No─▶ Draft pass note (→ HITL → Send)
 */
export function DecisionPanel({ app, result }: { app: Application; result: ScoreResult }) {
  const { holds, decisions, setDecision, outreach, startOutreach, cancelOutreach, bookings, unbook } = useStore();
  const decision = decisions[app.id] ?? "pending";
  const o = outreach[app.id];
  const hold = holds[app.id];
  const att = attendeesFor(app);
  const rec = result.recommendation;
  const locked = o && o.stage !== "draft"; // something already left the building

  const decide = (k: DecisionState) => {
    if (locked) return;
    const next = decision === k ? "pending" : k;
    setDecision(app.id, next);
    if (o) cancelOutreach(app.id);
    if (bookings[app.id]) unbook(app.id);
    if (next === "call_approved") startOutreach(app.id, "invite");
    if (next === "pass_confirmed") startOutreach(app.id, "pass");
  };

  return (
    <div className="card p-5 space-y-5">
      <div>
        <div className="eyebrow">Final decision · partner</div>
        <p className="mt-1 text-[12px] text-faint">
          The desk recommends <b className="text-ink">{REC_COPY[rec].label}</b>. Nothing is sent or rejected until a partner decides here and approves the email.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(
          [
            ["call_approved", "Go · call", "go"],
            ["hold", "Hold", "hold"],
            ["pass_confirmed", "No · pass", "pass"],
          ] as const
        ).map(([k, label, tone]) => (
          <button
            key={k}
            disabled={!!locked}
            onClick={() => decide(k)}
            className={`tone-${tone} rounded-xl border px-2 py-2.5 text-[13px] transition-all disabled:opacity-60 ${decision === k ? "border-[var(--tone)] bg-[color-mix(in_srgb,var(--tone)_14%,transparent)] text-[var(--tone)]" : "border-line text-muted hover:text-ink"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {locked && <p className="text-[11px] text-faint -mt-3">Decision locked: an email has already gone out on this thread.</p>}

      {!o && decision !== "pass_confirmed" && (rec === "take_call" || rec === "partner_review") && (
        <div className="space-y-2 border-t border-line pt-5 text-[12.5px]">
          <div className="flex items-center justify-between">
            <div className="eyebrow">Call</div>
            <span className={`pill !text-[11px] !py-0 ${hold ? "tone-review" : ""}`}>{hold ? `Held · ${hold.label}` : "Not held"}</span>
          </div>
          <div className="text-muted">
            Lead: <span className="text-ink">{att.lead}</span>
            {att.others.length > 0 && <> · with {att.others.join(", ")}</>}
            <div className="text-faint mt-0.5">{att.note}</div>
          </div>
          <p className="text-[11.5px] text-faint">“Go” drafts the invite with this slot plus two alternatives, for your approval.</p>
          {app.callQuestions.length > 0 && (
            <ol className="list-decimal pl-4 space-y-1 text-ink/85">
              {app.callQuestions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          )}
        </div>
      )}

      {rec === "hold_conflict" && !o && (
        <div className="rounded-xl border border-hold/40 bg-hold/[0.06] p-3 text-[12.5px] text-ink/90">
          Conflict hold: Kushal speaks to the portfolio founder first. The applicant is not contacted until this clears (Meeting 4).
        </div>
      )}

      <OutreachPanel app={app} />
    </div>
  );
}
