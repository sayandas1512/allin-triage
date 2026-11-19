"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { backtest, REC_COPY } from "@/lib/engine";
import { MEMOS } from "@/lib/memos";
import { STAGE_COPY, type Outreach } from "@/lib/outreach";
import { useStore } from "@/lib/store";
import type { DecisionState, Recommendation } from "@/lib/types";
import { Reveal, SplitHeading } from "@/components/motion";
import { SectionTitle } from "@/components/ui";

type Owner = "system" | "partner" | "agent";

/** The whiteboard, left to right. */
const STAGES: { id: string; label: string; owner: Owner; note: string }[] = [
  { id: "rubric", label: "Define rubric", owner: "system", note: "7 criteria · 2 lenses" },
  { id: "collect", label: "Collect info", owner: "system", note: "Deck · form · web search" },
  { id: "score", label: "Score", owner: "system", note: "Criterion by criterion" },
  { id: "recommend", label: "Recommend", owner: "system", note: "Gates + thresholds" },
  { id: "decision", label: "Final decision", owner: "partner", note: "Go / hold / no" },
  { id: "draft", label: "Draft email", owner: "system", note: "Invite or pass note" },
  { id: "approve", label: "Approve", owner: "partner", note: "Human in the loop" },
  { id: "send", label: "Send", owner: "system", note: "Outbox" },
  { id: "agent", label: "Booking agent", owner: "agent", note: "Yes · no · no reply → follow up" },
  { id: "outcome", label: "Outcome", owner: "system", note: "Booked · declined · closed" },
];

const OWNER_COPY: Record<Owner, { label: string; tone: string; icon: string }> = {
  system: { label: "Automated", tone: "mandate", icon: "◆" },
  partner: { label: "Partner (HITL)", tone: "review", icon: "👤" },
  agent: { label: "Agent", tone: "go", icon: "✦" },
};

/** Index of the stage an application is currently waiting at, and whether it is finished. */
function position(decision: DecisionState | undefined, o: Outreach | undefined) {
  if (o) {
    if (o.stage === "draft") return { at: 6, done: false, skipAgent: o.kind === "pass" };
    if (o.stage === "awaiting_reply" || o.stage === "needs_human") return { at: 8, done: false, skipAgent: false };
    return { at: 9, done: true, skipAgent: o.kind === "pass" };
  }
  return { at: 4, done: false, skipAgent: decision === "pass_confirmed" };
}

export default function Pipeline() {
  const { apps, scoreOf, decisions, outreach, holds, rubric, allRubricVersions, activeRubricId } = useStore();
  const [digest, setDigest] = useState<{ state: "idle" | "sending" | "sent" | "failed"; note?: string }>({ state: "idle" });
  const track = useRef<HTMLDivElement>(null);

  const rows = apps.map((a) => {
    const r = scoreOf(a);
    const o = outreach[a.id];
    const d = decisions[a.id];
    return { a, r, o, d, pos: position(d, o) };
  });
  const counts = STAGES.map((_, i) => rows.filter((x) => x.pos.at === i && !x.pos.done).length);
  const finished = rows.filter((x) => x.pos.done).length;

  const waiting = [
    ...rows
      .filter((x) => !x.o && (!x.d || x.d === "pending") && (x.r.recommendation === "take_call" || x.r.recommendation === "partner_review"))
      .map((x) => ({ x, what: `Decide: desk recommends ${REC_COPY[x.r.recommendation].label.toLowerCase()}${holds[x.a.id] ? ` · slot held ${holds[x.a.id].label}` : ""}` })),
    ...rows.filter((x) => x.o?.stage === "draft").map((x) => ({ x, what: `Approve the ${x.o!.kind === "invite" ? "invite" : "pass note"} draft` })),
    ...rows.filter((x) => x.o?.stage === "needs_human").map((x) => ({ x, what: `Agent needs you: ${x.o!.agentNote ?? "reply to founder"}` })),
  ];

  async function sendDigest() {
    setDigest({ state: "sending" });
    const pre = backtest(MEMOS.map((m) => ({ ...m, scores: { ...m.scores, risk_ownership: 5 } })), "revealed", rubric);
    const order: Recommendation[] = ["take_call", "partner_review", "hold_conflict", "out_of_mandate", "lean_pass"];
    const firstSentence = (t: string) => (t.match(/^.*?[.!?](\s|$)/)?.[0] ?? t).trim();
    const payload = {
      week: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      origin: window.location.origin,
      rubric: (allRubricVersions.find((v) => v.id === activeRubricId) ?? allRubricVersions[0]).name,
      trust: `Backtest on pre-call information: ${pre.strict}/${pre.total} agree, ${pre.hardMisses.length} hard misses.`,
      lanes: order.map((rec) => ({
        title: REC_COPY[rec].label,
        tone: REC_COPY[rec].tone,
        items: rows
          .filter((x) => x.r.recommendation === rec)
          .sort((p, q) => q.r.composite - p.r.composite)
          .map((x) => ({ name: x.a.name, id: x.a.id, score: x.r.composite, line: firstSentence(x.a.summary).slice(0, 380) })),
      })),
      waiting: waiting.map(({ x, what }) => ({ name: x.a.name, id: x.a.id, what: what.slice(0, 280) })),
      outreach: rows.filter((x) => x.o).map((x) => `${x.a.name}: ${STAGE_COPY[x.o!.stage].label}${x.o!.booked ? ` · ${x.o!.booked.label}` : ""}`),
    };
    try {
      const res = await fetch("/api/digest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      setDigest({ state: json.delivery === "sent" ? "sent" : "failed", note: json.note ?? json.error });
    } catch (e) {
      setDigest({ state: "failed", note: e instanceof Error ? e.message : String(e) });
    }
  }

  useGSAP(
    () => {
      if (reduced()) return;
      const tl = gsap.timeline();
      tl.from(".stage-node", { y: 30, opacity: 0, stagger: 0.07, duration: 0.7, ease: "back.out(1.6)" })
        .fromTo(".stage-line", { scaleX: 0 }, { scaleX: 1, transformOrigin: "0 50%", stagger: 0.07, duration: 0.4, ease: "power2.out" }, 0.2)
        .from(".loop-arc", { scaleX: 0, opacity: 0, transformOrigin: "50% 100%", duration: 0.9, stagger: 0.2, ease: "expo.out" }, 0.6);
      gsap.to(".stage-busy", { scale: 1.12, repeat: -1, yoyo: true, duration: 0.9, ease: "sine.inOut", transformOrigin: "50% 50%" });
      gsap.to(".cell-now", { boxShadow: "0 0 0 6px color-mix(in srgb, var(--go) 0%, transparent)", repeat: -1, duration: 1.4, ease: "power1.out" });
    },
    { scope: track },
  );

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 pt-14">
      <div className="eyebrow mb-4">Pipeline · the whiteboard, running</div>
      <SplitHeading className="display text-[clamp(44px,7vw,92px)] max-w-5xl">From inbound deck to a booked call — with a human at every gate.</SplitHeading>

      <div ref={track}>
        {/* Stage track */}
        <section className="mt-12 card p-5 sm:p-8 overflow-x-auto">
          <div className="relative min-w-[1050px]">
            {/* feedback loops, as drawn on the board: decision → recommendation, send → draft */}
            {[
              { from: 3, to: 4, label: "↺ corrections loop" },
              { from: 5, to: 7, label: "↺ edit-before-send loop" },
            ].map((l) => (
              <div key={l.label} className="loop-arc absolute top-1 h-9 rounded-t-[40px] border-2 border-b-0 border-dashed border-review/70" style={{ left: `${(l.from + 0.5) * 10}%`, width: `${(l.to - l.from) * 10}%` }}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] num text-review">{l.label}</span>
              </div>
            ))}
            <div className="grid grid-cols-10 gap-0 pt-12">
              {STAGES.map((s, i) => {
                const own = OWNER_COPY[s.owner];
                return (
                  <div key={s.id} className="relative flex flex-col items-center text-center px-1">
                    {i < STAGES.length - 1 && <div className="stage-line absolute top-6 left-1/2 w-full h-px bg-line-2" />}
                    <div
                      className={`stage-node relative z-10 grid h-12 w-12 place-items-center rounded-2xl border tone-${own.tone} ${counts[i] ? "stage-busy" : ""}`}
                      style={{ borderColor: "var(--tone)", background: "color-mix(in srgb, var(--tone) 12%, var(--panel))" }}
                    >
                      <span className="text-[15px]" style={{ color: "var(--tone)" }}>
                        {own.icon}
                      </span>
                      {counts[i] > 0 && <span className="absolute -top-2 -right-2 num rounded-full bg-ink px-1.5 text-[10px] text-bg">{counts[i]}</span>}
                    </div>
                    <div className="stage-node mt-3 text-[12.5px] font-medium leading-tight">
                      {s.id === "rubric" ? (
                        <Link href="/rubric" className="underline-link hover:text-go">
                          {s.label}
                        </Link>
                      ) : s.id === "collect" ? (
                        <Link href="/intake" className="underline-link hover:text-go">
                          {s.label}
                        </Link>
                      ) : (
                        s.label
                      )}
                    </div>
                    <div className="stage-node mt-1 text-[10.5px] text-faint leading-snug">{s.note}</div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-[11.5px] text-muted">
            {(Object.keys(OWNER_COPY) as Owner[]).map((k) => (
              <span key={k} className={`pill tone-${OWNER_COPY[k].tone} !text-[11px] !py-0`}>
                {OWNER_COPY[k].icon} {OWNER_COPY[k].label}
              </span>
            ))}
            <span className="pill !text-[11px] !py-0">{finished} finished</span>
          </div>
        </section>

        {/* Waiting on humans */}
        <section className="pt-16">
          <Reveal>
            <SectionTitle eyebrow="Inbox for partners" title={`${waiting.length} thing${waiting.length === 1 ? "" : "s"} waiting on a human`}>
              Everything else is moving on its own. These are the only places the system stops and asks.
            </SectionTitle>
            <div data-reveal className="mb-4 flex flex-wrap items-center gap-3">
              <button className="btn btn-primary !text-[12px]" disabled={digest.state === "sending"} onClick={sendDigest}>
                {digest.state === "sending" ? "Sending…" : "✉ Email this week's digest to partners"}
              </button>
              {digest.state !== "idle" && digest.state !== "sending" && (
                <span className={`text-[12px] ${digest.state === "sent" ? "text-go" : "text-critical"}`}>{digest.state === "sent" ? "✓ " : "✕ "}{digest.note}</span>
              )}
              <span className="text-[11px] text-faint">Goes only to the configured partner inbox: every lane, what&apos;s waiting on you, and call status.</span>
            </div>
            <div className="card divide-y divide-line">
              {waiting.length === 0 && <div className="p-6 text-muted text-sm">Nothing waiting. 🎉</div>}
              {waiting.map(({ x, what }) => (
                <Link key={`${x.a.id}-${what}`} href={`/applications/${x.a.id}`} data-reveal className="flex flex-wrap items-center gap-3 p-4 hover:bg-white/[0.02]">
                  <span className="font-medium w-36">{x.a.name}</span>
                  <span className="text-[13px] text-muted flex-1">{what}</span>
                  <span className="text-muted">→</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Matrix */}
        <section className="pt-16">
          <Reveal>
            <SectionTitle eyebrow="Every application" title="Where each one is" />
          </Reveal>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[1000px] text-[12px]">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="p-3 font-normal eyebrow">Company</th>
                  {STAGES.map((s) => (
                    <th key={s.id} className="p-2 font-normal text-[10.5px] text-faint text-center">
                      {s.label}
                    </th>
                  ))}
                  <th className="p-3 font-normal eyebrow">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .sort((p, q) => q.pos.at - p.pos.at || q.r.composite - p.r.composite)
                  .map(({ a, r, o, d, pos }) => (
                    <tr key={a.id} className="border-b border-line last:border-0 hover:bg-white/[0.02]">
                      <td className="p-3">
                        <Link href={`/applications/${a.id}`} className="font-medium hover:text-go">
                          {a.name}
                        </Link>
                        <div className="text-[10.5px] text-faint">
                          {r.composite.toFixed(1)} · {REC_COPY[r.recommendation].short}
                        </div>
                      </td>
                      {STAGES.map((s, i) => {
                        const na = pos.skipAgent && i === 8;
                        const state = na ? "na" : pos.done || i < pos.at ? "done" : i === pos.at ? "now" : "todo";
                        return (
                          <td key={s.id} className="p-2 text-center">
                            {state === "na" ? (
                              <span className="text-faint">–</span>
                            ) : (
                              <span
                                className={`inline-block h-3 w-3 rounded-full ${state === "now" ? "cell-now" : ""}`}
                                style={{
                                  background: state === "done" ? "var(--go)" : state === "now" ? "var(--review)" : "transparent",
                                  border: state === "todo" ? "1px solid var(--line-2)" : "none",
                                  boxShadow: state === "now" ? "0 0 0 0 color-mix(in srgb, var(--review) 60%, transparent)" : undefined,
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 whitespace-nowrap">
                        {o ? (
                          <span className={`pill tone-${STAGE_COPY[o.stage].tone} !text-[10.5px] !py-0`}>{STAGE_COPY[o.stage].label}</span>
                        ) : (
                          <span className="pill !text-[10.5px] !py-0 text-muted">{d === "hold" ? "On hold" : "Awaiting decision"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
