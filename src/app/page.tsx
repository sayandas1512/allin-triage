"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { BRIEF_MINUTES_PER_APP, RIYA_MINUTES_PER_APP } from "@/lib/engine";
import { LENS_COPY } from "@/lib/thesis";
import { CountUp, Magnetic, Reveal, SplitHeading } from "@/components/motion";
import { FlowGraphic } from "@/components/desk/FlowGraphic";
import { Board } from "@/components/desk/Board";
import { LensToggle, RecBadge, SectionTitle } from "@/components/ui";

export default function Desk() {
  const { apps, scoreOf, holds, lens } = useStore();
  const evidence = apps.flatMap((a) => a.assessments.flatMap((x) => x.evidence));
  const cited = evidence.filter((e) => e.source.length > 0).length;
  const contradictions = evidence.filter((e) => e.verification === "contradicted").length;
  const gaps = apps.reduce((t, a) => t + a.gaps.length, 0);
  const saved = apps.length * (RIYA_MINUTES_PER_APP - BRIEF_MINUTES_PER_APP);

  const stats = [
    { n: apps.length, label: "applications read", sub: "deck + form, whole pile" },
    { n: Math.round((cited / Math.max(1, evidence.length)) * 100), suffix: "%", label: "claims with a source", sub: `${evidence.length} claims traced` },
    { n: contradictions, label: "contradictions caught", sub: "deck vs form vs arithmetic" },
    { n: gaps, label: "gaps named", sub: "not quietly filled in" },
    { n: Object.keys(holds).length, label: "calls pre-held", sub: "Tue/Thu, awaiting Kushal" },
    { n: saved / 60, decimals: 1, suffix: "h", label: "Riya-time freed", sub: `${RIYA_MINUTES_PER_APP}→${BRIEF_MINUTES_PER_APP} min per app (est.)` },
  ];

  const ranked = apps.map((a) => ({ a, r: scoreOf(a) })).sort((x, y) => y.r.composite - x.r.composite);

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8">
      {/* Hero */}
      <section className="pt-14 sm:pt-20 pb-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] items-center">
        <div>
          <div className="eyebrow mb-5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-go animate-pulse" /> Week of 18 Nov 2026 · Fund II intake
          </div>
          <SplitHeading className="display text-[clamp(44px,7vw,92px)]">
            The whole pile, read. Every claim, <em className="text-go">sourced.</em>
          </SplitHeading>
          <Reveal>
            <p data-reveal className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
              Each application is scored against All In Capital&apos;s thesis — seven criteria reconstructed from public interviews, twelve deal memos and five partner meetings.
              The desk makes the case and shows its work. It does not decide.
            </p>
            <blockquote data-reveal className="mt-6 border-l-2 border-go pl-4 text-[14px] italic text-ink/80 max-w-xl">
              “If it tells me a company is a seven out of ten and can&apos;t tell me which part of our thesis it&apos;s scoring against, that&apos;s worse than useless.”
              <span className="mt-1 block not-italic text-xs text-muted">— Kushal Bhagia, the brief</span>
            </blockquote>
            <div data-reveal className="mt-8 flex flex-wrap items-center gap-3">
              <LensToggle />
              <span className="text-xs text-muted max-w-xs">{LENS_COPY[lens].blurb}</span>
            </div>
          </Reveal>
        </div>
        <div className="card p-4 sm:p-6">
          <FlowGraphic />
        </div>
      </section>

      {/* Stats */}
      <Reveal className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 py-10">
        {stats.map((s) => (
          <div key={s.label} data-reveal className="card p-4">
            <CountUp to={s.n} decimals={s.decimals ?? 0} suffix={s.suffix ?? ""} className="text-3xl" />
            <div className="mt-1 text-[13px]">{s.label}</div>
            <div className="text-[11px] text-faint">{s.sub}</div>
          </div>
        ))}
      </Reveal>

      {/* Board */}
      <section className="pt-10">
        <Reveal>
          <SectionTitle eyebrow="Triage board" title="Where each application lands">
            Switch the lens in the header to watch applications move between columns. Cards marked <span className="pill tone-review !text-[11px] !py-0">Lens split</span>{" "}
            are where the written thesis and the fund&apos;s actual behaviour disagree — Riya&apos;s drift, made visible.
          </SectionTitle>
        </Reveal>
        <Board />
      </section>

      {/* Digest */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Two lines for Kushal & Aditya" title="The batch digest">
            What Riya used to write by hand after 30 minutes per deck.
          </SectionTitle>
          <div className="card divide-y divide-line overflow-hidden">
            {ranked.map(({ a, r }) => (
              <Link key={a.id} href={`/applications/${a.id}`} data-reveal className="grid gap-3 p-5 sm:grid-cols-[180px_130px_1fr_auto] items-start hover:bg-white/[0.02] transition-colors">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted">
                    {a.sectorActual} · {a.city}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="num text-xl">{r.composite.toFixed(1)}</span>
                  <RecBadge rec={r.recommendation} size="sm" />
                </div>
                <p className="text-[13.5px] leading-relaxed text-ink/85">{a.summary}</p>
                <span className="text-muted text-sm hidden sm:block">→</span>
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Trust CTA */}
      <section className="pt-24">
        <Reveal className="card relative overflow-hidden p-8 sm:p-12">
          <div data-reveal className="eyebrow">Before this touches a real decision</div>
          <h3 data-reveal className="display mt-3 text-4xl sm:text-6xl max-w-3xl">
            How far can Kushal trust it — and exactly where does it break?
          </h3>
          <p data-reveal className="mt-4 max-w-2xl text-muted">
            The engine was run against the fund&apos;s twelve real decisions under three conditions, with pass/fail thresholds written down in advance.
          </p>
          <div data-reveal className="mt-8">
            <Magnetic>
              <Link href="/backtest" className="btn btn-primary !px-6 !py-3">
                Open the backtest →
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
