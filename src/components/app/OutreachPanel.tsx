"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { STAGE_COPY, type Author, type Draft } from "@/lib/outreach";
import { buildICS } from "@/lib/schedule";
import { useStore } from "@/lib/store";
import type { Application } from "@/lib/types";

const PRESETS = [
  { label: "Accepts a slot", text: (first: string) => `Thanks! ${first} works for us. Looking forward to it.` },
  { label: "Proposes another time", text: () => `Thanks for reaching out — could we do the following Thursday around 4pm instead?` },
  { label: "Asks about terms", text: () => `Happy to talk. Before we do, what cheque size and valuation range do you usually look at?` },
  { label: "Declines", text: () => `Thanks for the note, but we closed our round last week, so we'll pass for now.` },
];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/calendar" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const fmt = (iso: string) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function OutreachPanel({ app }: { app: Application }) {
  const { outreach, updateDraft, approveAndSend, cancelOutreach, founderReply, sendPendingReply, advanceClock, clock, outreachSettings, clockOffsetDays } = useStore();
  const o = outreach[app.id];
  const [as, setAs] = useState<Author>("Kushal");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Draft | null>(null);
  const thread = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!thread.current || reduced()) return;
      const last = thread.current.lastElementChild;
      if (last) gsap.from(last, { y: 16, opacity: 0, duration: 0.5, ease: "power3.out" });
    },
    { dependencies: [o?.messages.length] },
  );

  if (!o) return null;
  const stage = STAGE_COPY[o.stage];
  const draft = o.draft;
  const pendingDraft = pending ?? o.pendingReply ?? null;
  const sinceOut = o.lastOutboundAt && clock !== null ? (clock - new Date(o.lastOutboundAt).getTime()) / 86_400_000 : 0;
  const nextFollowIn = Math.max(0, outreachSettings.followUpDays - sinceOut);

  const deliver = async (text: string) => {
    if (!text.trim()) return;
    setBusy(true);
    await founderReply(app.id, text.trim());
    setReply("");
    setPending(null);
    setBusy(false);
  };

  return (
    <div className="space-y-4 border-t border-line pt-5">
      <div className="flex items-center justify-between gap-2">
        <div className="eyebrow">{o.kind === "invite" ? "Outreach · invite" : "Outreach · pass"}</div>
        <span className={`pill tone-${stage.tone} !text-[11px] !py-0`}>{stage.label}</span>
      </div>
      {o.agentNote && (
        <div className="rounded-xl border border-mandate/30 bg-mandate/[0.06] p-3 text-[12.5px]">
          <span className="eyebrow !text-mandate mr-1.5">Agent</span>
          {o.agentNote}
        </div>
      )}

      {/* HITL: draft → approve → send */}
      {o.stage === "draft" && draft && (
        <div className="space-y-2">
          {o.offered.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {o.offered.map((s) => (
                <span key={s.start} className="pill tone-review !text-[11px] !py-0">
                  {s.label}
                </span>
              ))}
            </div>
          )}
          <input className="input !text-[12.5px]" value={draft.subject} onChange={(e) => updateDraft(app.id, { ...draft, subject: e.target.value })} />
          <textarea className="input !text-[12.5px] h-56 leading-relaxed" value={draft.body} onChange={(e) => updateDraft(app.id, { ...draft, body: e.target.value })} />
          <div className="text-[11px] text-faint">To: {draft.to}</div>
          <div className="flex flex-wrap items-center gap-2">
            <select className="input !w-auto !py-1.5 !text-[12px]" value={as} onChange={(e) => setAs(e.target.value as Author)}>
              <option>Kushal</option>
              <option>Riya</option>
            </select>
            <button className="btn btn-primary !text-[12px] !py-1.5" onClick={() => approveAndSend(app.id, as)}>
              ✓ Approve & send
            </button>
            <button className="btn !text-[12px] !py-1.5" onClick={() => cancelOutreach(app.id)}>
              Discard
            </button>
          </div>
          <p className="text-[11px] text-faint">Human in the loop: nothing reaches the founder until a partner approves this draft.</p>
        </div>
      )}

      {/* Thread */}
      {o.messages.length > 0 && (
        <div ref={thread} className="space-y-2 max-h-80 overflow-auto pr-1">
          {o.messages.map((m) => (
            <div key={m.id} className={`rounded-xl border p-3 text-[12px] ${m.dir === "in" ? "border-go/30 bg-go/[0.05] ml-6" : "border-line bg-bg/60 mr-6"}`}>
              <div className="flex items-center justify-between gap-2 text-[10.5px] text-muted">
                <span>
                  <b className="text-ink">{m.by}</b> · {fmt(m.at)}
                </span>
                {m.delivery && (
                  <span
                    title={m.deliveryNote}
                    className={`pill !text-[9.5px] !py-0 !px-1.5 ${m.delivery === "sent" ? "tone-go" : m.delivery === "failed" ? "tone-critical" : m.delivery === "sending" ? "tone-review" : ""}`}
                  >
                    {m.delivery === "sent" ? "✓ sent · Resend" : m.delivery === "failed" ? "✕ failed" : m.delivery === "sending" ? "sending…" : "simulated send"}
                  </span>
                )}
              </div>
              <div className="mt-1 whitespace-pre-wrap leading-relaxed text-ink/90">{m.body}</div>
              {m.note && <div className="mt-1 text-[10.5px] text-faint">{m.note}</div>}
              {m.deliveryNote && <div className={`mt-0.5 text-[10.5px] ${m.delivery === "failed" ? "text-critical" : "text-faint"}`}>{m.deliveryNote}</div>}
            </div>
          ))}
        </div>
      )}

      {/* Booking agent input: founder replies are simulated because founders are fictional */}
      {(o.stage === "awaiting_reply" || o.stage === "needs_human") && o.kind === "invite" && (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <div className="eyebrow">Simulate a founder reply</div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.label} className="pill !text-[11px] !py-0.5 text-muted hover:text-ink" onClick={() => setReply(p.text(o.offered[0]?.label ?? "Thursday 3pm"))}>
                {p.label}
              </button>
            ))}
          </div>
          <textarea className="input !text-[12.5px] h-20" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type what the founder writes back…" />
          <button className="btn btn-primary !text-[12px] !py-1.5" disabled={busy || !reply.trim()} onClick={() => deliver(reply)}>
            {busy ? "Agent reading…" : "Deliver to booking agent"}
          </button>
        </div>
      )}

      {o.stage === "needs_human" && pendingDraft && (
        <div className="space-y-2 rounded-xl border border-hold/40 p-3">
          <div className="eyebrow !text-hold">Agent drafted a reply · your approval</div>
          <textarea className="input !text-[12.5px] h-32" value={pendingDraft.body} onChange={(e) => setPending({ ...pendingDraft, body: e.target.value })} />
          <button
            className="btn btn-primary !text-[12px] !py-1.5"
            disabled={!pendingDraft.body.trim()}
            onClick={() => {
              sendPendingReply(app.id, as, pendingDraft);
              setPending(null);
            }}
          >
            ✓ Approve & send as {as}
          </button>
        </div>
      )}

      {o.stage === "awaiting_reply" && (
        <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-muted">
          <span>
            Follow-up {o.followUps}/{outreachSettings.maxFollowUps} · next in {nextFollowIn.toFixed(1)} days
          </span>
          <button className="btn !text-[11px] !py-1 !px-2.5" onClick={() => advanceClock(1)}>
            +1 day
          </button>
          <button className="btn !text-[11px] !py-1 !px-2.5" onClick={() => advanceClock(outreachSettings.followUpDays)}>
            +{outreachSettings.followUpDays} days
          </button>
          {clockOffsetDays > 0 && <span className="text-faint">demo clock +{clockOffsetDays}d</span>}
        </div>
      )}

      {o.stage === "booked" && o.booked && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-go">✓ {o.booked.label}</span>
          <button className="btn !text-[12px] !py-1.5" onClick={() => download(`${app.id}-call.ics`, buildICS(app, o.booked!))}>
            ↓ Calendar invite (.ics)
          </button>
        </div>
      )}
    </div>
  );
}
