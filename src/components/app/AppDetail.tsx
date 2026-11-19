"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { REC_COPY } from "@/lib/engine";
import { MEMO } from "@/lib/memos";
import { useStore } from "@/lib/store";
import { LENS_COPY } from "@/lib/thesis";
import type { Lens } from "@/lib/types";
import { Reveal, SplitHeading } from "../motion";
import { RecBadge, ScoreRing, SeverityPill, SourceChip, VERIFICATION_COPY } from "../ui";
import { CriterionRow } from "./CriterionRow";
import { DecisionPanel } from "./DecisionPanel";

export function AppDetail({ id }: { id: string }) {
  const { apps, scoreOf, lens, ready } = useStore();
  const app = apps.find((a) => a.id === id);
  const hero = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!app || reduced()) return;
      gsap.from("[data-hero]", { y: 24, opacity: 0, stagger: 0.07, duration: 0.9, ease: "expo.out", delay: 0.15 });
    },
    { scope: hero, dependencies: [app?.id] },
  );

  if (!app) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <p className="text-muted">{ready ? "No application with that id." : "Loading…"}</p>
        <Link href="/" className="btn mt-6">
          ← Back to the desk
        </Link>
      </div>
    );
  }

  const r = scoreOf(app);
  const otherLens: Lens = lens === "revealed" ? "stated" : "revealed";
  const other = scoreOf(app, otherLens);
  const conf = r.confidence;
  const counts = r.evidenceCounts;
  const totalEv = Object.values(counts).reduce((a, b) => a + b, 0);
  const order = ["critical", "high", "medium", "info"] as const;
  const flags = [...app.flags].sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 pt-10">
      <Link href="/" className="text-[13px] text-muted underline-link">
        ← Desk
      </Link>

      {/* Header */}
      <div ref={hero} className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] items-end">
        <div>
          <div data-hero className="flex flex-wrap gap-2 mb-4">
            <span className="pill text-muted !text-[11px]">
              Filed as {app.sectorSelected}
              {app.sectorSelected !== app.sectorActual && <> → scored as {app.sectorActual}</>}
            </span>
            <span className="pill text-muted !text-[11px]">{app.stage}</span>
            {app.raiseCr && (
              <span className="pill text-muted !text-[11px]">
                ₹{app.raiseCr} Cr{app.postMoneyCr ? ` @ ₹${app.postMoneyCr} Cr post` : ""}
              </span>
            )}
            <span className="pill text-muted !text-[11px]">{app.city}</span>
            <span className={`pill !text-[11px] ${app.source === "Public form" ? "text-muted" : "tone-go"}`}>{app.source}</span>
          </div>
          <SplitHeading className="display text-[clamp(48px,8vw,104px)]">{app.name}</SplitHeading>
          <p data-hero className="mt-3 text-lg text-muted max-w-2xl">
            {app.oneLiner}
          </p>
        </div>
        <div data-hero className="flex items-center gap-5">
          <ScoreRing value={r.composite} rec={r.recommendation} size={132} stroke={8} />
          <div className="space-y-2">
            <RecBadge rec={r.recommendation} />
            <div className="text-[12px] text-muted">
              Confidence <span className="num text-ink">{conf}</span> · {r.confidenceLabel}
            </div>
            <div className="text-[12px] text-muted">
              {LENS_COPY[otherLens].label}: <span className="num text-ink">{other.composite.toFixed(1)}</span> · {REC_COPY[other.recommendation].short}
            </div>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <Reveal className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div data-reveal className="card p-6">
          <div className="eyebrow mb-3">The read</div>
          <p className="text-[16px] leading-relaxed">{app.summary}</p>
          <ul className="mt-4 space-y-1.5 text-[13px] text-muted">
            {r.why.map((w) => (
              <li key={w} className="flex gap-2">
                <span className="text-go">›</span>
                {w}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-xl border border-line bg-bg/60 p-3 text-[12.5px] text-muted">
            <b className="text-ink">Scored against the {LENS_COPY[lens].label.toLowerCase()}.</b> {LENS_COPY[lens].blurb} Kushal asked: “tell me which one you used and why.”
          </div>
        </div>
        <div data-reveal className="card p-6">
          <div className="eyebrow mb-3">Evidence quality · {totalEv} claims</div>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {(Object.keys(counts) as (keyof typeof counts)[]).map((k) =>
              counts[k] ? <div key={k} title={`${VERIFICATION_COPY[k].label}: ${counts[k]}`} style={{ width: `${(counts[k] / totalEv) * 100}%`, background: `var(--${VERIFICATION_COPY[k].tone})` }} /> : null,
            )}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-y-2 text-[12.5px]">
            {(Object.keys(counts) as (keyof typeof counts)[]).map((k) => (
              <li key={k} className={`tone-${VERIFICATION_COPY[k].tone} flex items-center gap-2`}>
                <span className="dot" />
                <span className="text-muted">{VERIFICATION_COPY[k].label}</span>
                <span className="num ml-auto pr-4">{counts[k]}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {app.headline.map((h) => (
              <div key={h.label} className="rounded-xl border border-line p-3">
                <div className="num text-lg">{h.value}</div>
                <div className="text-[11px] text-muted">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Web research (live intake) */}
      {app.research && (
        <Reveal className="mt-4">
          <div data-reveal className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="eyebrow">Collect info · public web research</div>
              <span className="pill !text-[11px] !py-0 text-muted">{app.research.model} + Google Search</span>
            </div>
            <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink/85 max-h-72 overflow-auto">{app.research.notes.replace(/\*\*/g, "")}</div>
            {app.research.sources.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {app.research.sources.map((s) => (
                  <SourceChip key={s.url} s={{ kind: "web", ref: s.title, url: s.url }} />
                ))}
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* Gates */}
      {app.gates.length > 0 && (
        <Reveal className="mt-4 space-y-3">
          {app.gates.map((g) => (
            <div key={g.title} data-reveal className={`card p-5 border-l-4 ${g.hard ? "tone-hold" : "tone-review"}`} style={{ borderLeftColor: "var(--tone)" }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill !text-[11px]">{g.hard ? "Gate" : "Soft gate"}</span>
                <span className="font-medium">{g.title}</span>
              </div>
              <p className="mt-2 text-[13.5px] text-muted">{g.detail}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {g.source.map((s, i) => (
                  <SourceChip key={i} s={s} />
                ))}
              </div>
            </div>
          ))}
        </Reveal>
      )}

      {/* Main grid */}
      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_380px] items-start">
        <div className="space-y-14 min-w-0">
          <section>
            <div className="eyebrow mb-2">Criterion by criterion</div>
            <h2 className="display text-4xl mb-6">Which part of the thesis, and why</h2>
            <Reveal className="space-y-3">
              {r.criteria.map((c, i) => (
                <CriterionRow key={c.criterion} app={app} a={app.assessments.find((x) => x.criterion === c.criterion)} res={c} index={i} />
              ))}
            </Reveal>
            <p className="mt-3 text-[12px] text-faint num">
              Composite = Σ (score × weight) = {r.criteria.map((c) => `${c.final}×${c.weight}`).join(" + ")} = {r.composite}
            </p>
          </section>

          <section>
            <div className="eyebrow mb-2">Red flags</div>
            <h2 className="display text-4xl mb-6">What doesn&apos;t add up</h2>
            <Reveal className="space-y-3">
              {flags.map((f) => (
                <div key={f.title} data-reveal className="card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityPill s={f.severity} />
                    <span className="font-medium">{f.title}</span>
                  </div>
                  <p className="mt-2 text-[13.5px] text-muted leading-relaxed">{f.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {f.source.map((s, i) => (
                      <SourceChip key={i} s={s} />
                    ))}
                  </div>
                </div>
              ))}
            </Reveal>
          </section>

          <section>
            <div className="eyebrow mb-2">Gaps</div>
            <h2 className="display text-4xl mb-6">What it couldn&apos;t find out</h2>
            <Reveal className="card divide-y divide-line">
              {app.gaps.map((g) => (
                <div key={g.what} data-reveal className="p-5 grid gap-2 sm:grid-cols-[1fr_1fr]">
                  <div>
                    <div className="font-medium text-[14px]">{g.what}</div>
                    <div className="mt-1 text-[12.5px] text-muted">Tried: {g.tried}</div>
                  </div>
                  <div className="text-[13px] text-review/90 sm:border-l sm:border-line sm:pl-4">
                    <span className="eyebrow !text-review block mb-1">What it costs</span>
                    {g.cost}
                  </div>
                </div>
              ))}
            </Reveal>
          </section>

          <section>
            <div className="eyebrow mb-2">Precedent</div>
            <h2 className="display text-4xl mb-6">Closest past decisions</h2>
            <Reveal className="grid gap-3 sm:grid-cols-2">
              {app.precedents.map((p) => {
                const m = MEMO[p.memoId];
                if (!m) return null;
                return (
                  <div key={p.memoId} data-reveal className="card p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{m.name}</span>
                      <span className={`pill !text-[11px] !py-0 ${m.decision === "INVESTED" ? "tone-go" : "tone-pass"}`}>{m.decision === "INVESTED" ? "Invested" : "Passed"}</span>
                    </div>
                    <p className="mt-2 text-[13px] text-ink/85">{p.why}</p>
                    <p className="mt-2 text-[12px] text-muted italic">Memo: {m.reason}</p>
                  </div>
                );
              })}
            </Reveal>
          </section>

          <section>
            <div className="eyebrow mb-2">Founders, as stated</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {app.founders.map((f) => (
                <div key={f.name} className="card p-5">
                  <div className="font-medium">{f.name}</div>
                  <div className="text-[12px] text-muted">{f.role}</div>
                  <p className="mt-2 text-[13px] text-ink/85">{f.background}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24">
          <DecisionPanel key={app.id} app={app} result={r} />
        </aside>
      </div>
    </div>
  );
}
