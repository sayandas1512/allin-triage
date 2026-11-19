"use client";

import Link from "next/link";
import { adjustmentsFor } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { CRITERION, PARTNER_RULES } from "@/lib/thesis";
import type { Correction } from "@/lib/types";
import { Reveal, SplitHeading } from "@/components/motion";
import { SectionTitle, SourceChip } from "@/components/ui";

const EXAMPLES: Omit<Correction, "id" | "createdAt">[] = [
  {
    appId: "stocksathi",
    appName: "StockSathi",
    criterion: "risk_ownership",
    from: 5,
    to: 3.5,
    reason: "Unlicensed first-loss lending is a structure risk until signed NBFC terms exist — mark down any lender in that position.",
    author: "Kushal",
    tags: ["lending"],
    scope: "similar",
  },
  {
    appId: "pumpwise",
    appName: "Pumpwise",
    criterion: "defensibility",
    from: 6,
    to: 5,
    reason: "Hardware is copyable; only distribution counts as a moat at pre-seed.",
    author: "Aditya",
    tags: ["hardware"],
    scope: "similar",
  },
];

export default function Memory() {
  const { corrections, apps, addCorrection, removeCorrection, reset } = useStore();

  const impact = (c: Correction) =>
    apps
      .map((a) => ({ a, adj: adjustmentsFor(a, c.criterion, [c])[0] }))
      .filter((x) => x.adj);

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 pt-14">
      <div className="eyebrow mb-4">Correction memory</div>
      <SplitHeading className="display text-[clamp(44px,7vw,96px)] max-w-5xl">
        Correct it once. It remembers next quarter.
      </SplitHeading>
      <Reveal>
        <p data-reveal className="mt-6 max-w-2xl text-muted leading-relaxed">
          When Riya or a partner changes a score, they give a one-line reason and choose which kinds of company it applies to. Every later application with those tags gets the same adjustment —
          visibly, with the reason and who made it, and with a one-click “doesn&apos;t apply here”. Corrections never change scores silently.
        </p>
      </Reveal>

      <section className="pt-16">
        <Reveal>
          <SectionTitle eyebrow="Ledger" title={`${corrections.length} correction${corrections.length === 1 ? "" : "s"} on file`} />
        </Reveal>
        {corrections.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted">No corrections yet. Open any application and use “Correct this score” on a criterion — or load two examples to see how they propagate.</p>
            <div className="mt-5 flex justify-center gap-2 flex-wrap">
              <button className="btn btn-primary" onClick={() => EXAMPLES.forEach((e) => addCorrection(e))}>
                Load example corrections
              </button>
              <Link className="btn" href="/applications/stocksathi">
                Open StockSathi
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {corrections.map((c) => {
              const hits = impact(c);
              return (
                <div key={c.id} className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="pill !text-[11px] !py-0">{c.author}</span>
                        <span className="font-medium">{c.appName}</span>
                        <span className="text-muted text-[13px]">· {CRITERION[c.criterion].name}</span>
                        <span className="num text-[13px]">
                          {c.from} → <b style={{ color: c.to > c.from ? "var(--go)" : "var(--pass)" }}>{c.to}</b>
                        </span>
                      </div>
                      <p className="mt-2 text-[14px]">“{c.reason}”</p>
                      <div className="mt-2 text-[12px] text-muted">
                        {c.scope === "this" ? "This company only" : <>Generalises to: {c.tags.map((t) => <span key={t} className="pill tone-go !text-[10.5px] !py-0 mr-1">{t}</span>)}</>}
                        <span className="ml-2 text-faint">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <button className="btn !text-[12px] !py-1.5" onClick={() => removeCorrection(c.id)}>
                      Remove
                    </button>
                  </div>
                  <div className="mt-4 border-t border-line pt-4">
                    <div className="eyebrow mb-2">Now affects</div>
                    <div className="flex flex-wrap gap-2">
                      {hits.map(({ a, adj }) => (
                        <Link key={a.id} href={`/applications/${a.id}`} className="pill !text-[12px] hover:border-ink">
                          {a.name}
                          <span className="num" style={{ color: adj!.delta > 0 ? "var(--go)" : "var(--pass)" }}>
                            {adj!.delta > 0 ? "+" : ""}
                            {adj!.delta.toFixed(1)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex gap-2">
              <button className="btn !text-[12px]" onClick={reset}>
                Reset all local state
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Already learned" title="Corrections codified from the partner notes">
            These past corrections are built into the engine as rules rather than score adjustments.
          </SectionTitle>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { was: "Riya scored Petalry 6.5 with no repeat rate", now: "Missing deciding metric is imputed at 3/10 and lowers confidence", src: PARTNER_RULES[0].src },
              { was: "Riya scored AeroDrop 7.5 on credentials", now: "Founder–market fit and path-to-market are separate criteria; credentials alone score nothing", src: PARTNER_RULES[2].src },
              { was: "Riya gave the meeting-notes startup a 7 before spotting MeetRecord", now: "Every application is checked against the full portfolio list; conflicts are a hard gate", src: PARTNER_RULES[4].src },
              { was: "“Score against the written thesis or what we do?”", now: "Both lenses computed; the desk states which one is driving the recommendation", src: PARTNER_RULES[8].src },
            ].map((x) => (
              <div key={x.was} data-reveal className="card p-5">
                <div className="text-[12.5px] text-muted line-through decoration-pass/60">{x.was}</div>
                <div className="mt-2 text-[14px]">{x.now}</div>
                <div className="mt-3">
                  <SourceChip s={x.src} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
