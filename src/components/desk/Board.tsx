"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef } from "react";
import { Flip, gsap, useGSAP, reduced } from "@/lib/gsap";
import { REC_COPY } from "@/lib/engine";
import { onBeforeLensChange, useStore } from "@/lib/store";
import { STAGE_COPY } from "@/lib/outreach";
import type { Recommendation } from "@/lib/types";
import { RecBadge, ScoreRing } from "../ui";

const COLUMNS: { rec: Recommendation; blurb: string }[] = [
  { rec: "take_call", blurb: "Tentative Tue/Thu slot already held. Kushal approves before anything is sent." },
  { rec: "partner_review", blurb: "Borderline, soft-gated, or the lenses disagree. A partner reads the brief." },
  { rec: "hold_conflict", blurb: "Possible portfolio conflict. Nothing moves until it is cleared." },
  { rec: "out_of_mandate", blurb: "Outside stage or cheque size. Warm decline." },
  { rec: "lean_pass", blurb: "Pass note drafted with what would change our view." },
];

const DECISION_COPY = { call_approved: "Call approved", pass_confirmed: "Pass confirmed", hold: "On hold", pending: "" } as const;

export function Board() {
  const { apps, scoreOf, holds, bookings, decisions, lens, ready, outreach } = useStore();
  const root = useRef<HTMLDivElement>(null);
  const flipState = useRef<ReturnType<typeof Flip.getState> | null>(null);

  useEffect(
    () =>
      onBeforeLensChange(() => {
        if (root.current) flipState.current = Flip.getState(root.current.querySelectorAll("[data-flip-id]"));
      }),
    [],
  );

  useLayoutEffect(() => {
    const st = flipState.current;
    if (!st || !root.current) return;
    flipState.current = null;
    if (reduced()) return;
    Flip.from(st, {
      targets: root.current.querySelectorAll("[data-flip-id]"),
      duration: 0.9,
      ease: "expo.inOut",
      stagger: 0.03,
      absolute: true,
      onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6 }),
    });
  }, [lens]);

  useGSAP(
    () => {
      if (!ready || reduced()) return;
      gsap.from("[data-flip-id]", {
        y: 40,
        opacity: 0,
        stagger: 0.05,
        duration: 0.9,
        ease: "expo.out",
        scrollTrigger: { trigger: root.current, start: "top 85%", once: true },
      });
    },
    { scope: root, dependencies: [ready] },
  );

  const scored = apps.map((a) => {
    const r = scoreOf(a);
    const other = scoreOf(a, lens === "revealed" ? "stated" : "revealed");
    return { a, r, lensSplit: other.recommendation !== r.recommendation };
  });

  return (
    <div ref={root} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {COLUMNS.map(({ rec, blurb }) => {
        const items = scored.filter((x) => x.r.recommendation === rec).sort((x, y) => y.r.composite - x.r.composite);
        return (
          <section key={rec} className="flex flex-col gap-3 min-w-0">
            <header className={`tone-${REC_COPY[rec].tone} rounded-2xl border border-line px-4 py-3`}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--tone)" }}>
                  <span className="dot" />
                  {REC_COPY[rec].label}
                </span>
                <span className="num text-muted text-sm">{items.length}</span>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-snug text-faint">{blurb}</p>
            </header>
            {items.map(({ a, r, lensSplit }) => {
              const hold = holds[a.id];
              const booking = bookings[a.id];
              const d = decisions[a.id];
              const o = outreach[a.id];
              const flagN = a.flags.filter((f) => f.severity === "critical" || f.severity === "high").length;
              return (
                <Link
                  key={a.id}
                  href={`/applications/${a.id}`}
                  data-flip-id={a.id}
                  className="card group block p-4 transition-colors hover:border-line-2 will-change-transform"
                >
                  <div className="flex items-start gap-3">
                    <ScoreRing value={r.composite} rec={r.recommendation} size={52} stroke={4} />
                    <div className="min-w-0">
                      <div className="font-medium leading-tight group-hover:text-go transition-colors">{a.name}</div>
                      <div className="mt-0.5 text-[12px] text-muted leading-snug line-clamp-2">{a.oneLiner}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                    <span className="pill !text-[11px] !py-0 text-muted">{a.sectorActual}</span>
                    {a.source !== "Public form" && <span className="pill tone-go !text-[11px] !py-0">Warm intro</span>}
                    {flagN > 0 && <span className="pill tone-critical !text-[11px] !py-0">{flagN} red flag{flagN > 1 ? "s" : ""}</span>}
                    {lensSplit && (
                      <span className="pill tone-review !text-[11px] !py-0" title="The stated and revealed thesis disagree on this one">
                        Lens split
                      </span>
                    )}
                    <span className="pill !text-[11px] !py-0 text-muted">conf {r.confidence}</span>
                  </div>
                  {o && (
                    <div className="mt-3 border-t border-line pt-2.5">
                      <span className={`pill tone-${STAGE_COPY[o.stage].tone} !text-[10.5px] !py-0`}>{STAGE_COPY[o.stage].label}</span>
                    </div>
                  )}
                  {!o && (hold || booking || d) && (
                    <div className="mt-3 border-t border-line pt-2.5 text-[11.5px] text-muted">
                      {booking ? (
                        <span className="text-go">✓ Booked · {booking.label}</span>
                      ) : hold ? (
                        <span>◷ Held · {hold.label}</span>
                      ) : null}
                      {d && d !== "pending" && <div className="text-ink mt-0.5">{DECISION_COPY[d]}</div>}
                    </div>
                  )}
                </Link>
              );
            })}
            {items.length === 0 && <div className="rounded-2xl border border-dashed border-line p-4 text-center text-xs text-faint">None this batch</div>}
          </section>
        );
      })}
    </div>
  );
}

export { RecBadge };
