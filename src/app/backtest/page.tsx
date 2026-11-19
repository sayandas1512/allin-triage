"use client";

import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { backtest, REC_COPY, scoreMemo } from "@/lib/engine";
import { MEMOS } from "@/lib/memos";
import type { Rubric } from "@/lib/rubric";
import { useStore } from "@/lib/store";
import { CountUp, Reveal, SplitHeading } from "@/components/motion";
import { SectionTitle } from "@/components/ui";

type Mode = "precall" | "insample" | "stated";

const MODES: Record<Mode, { label: string; blurb: string }> = {
  precall: {
    label: "Pre-call information",
    blurb: "Founder risk-ownership — mostly observed in the room — set to neutral (5). Closest to what the desk actually sees from a deck and form.",
  },
  insample: {
    label: "In-sample (memo text)",
    blurb: "Every criterion scored from the memo. The memos were written after the decision and the weights were derived from them, so this is an upper bound, not evidence.",
  },
  stated: {
    label: "Stated thesis",
    blurb: "Same scores, weighted the way the public thesis reads. Tests whether the written thesis would reproduce what the fund actually did.",
  },
};

function runMode(mode: Mode, rubric: Rubric) {
  if (mode === "precall") return backtest(MEMOS.map((m) => ({ ...m, scores: { ...m.scores, risk_ownership: 5 } })), "revealed", rubric);
  if (mode === "stated") return backtest(MEMOS, "stated", rubric);
  return backtest(MEMOS, "revealed", rubric);
}

export default function Backtest() {
  const [mode, setMode] = useState<Mode>("precall");
  const { apps, rubric, allRubricVersions, activeRubricId } = useStore();
  const THRESHOLDS = rubric.thresholds;
  const bt = useMemo(() => runMode(mode, rubric), [mode, rubric]);
  const all = useMemo(() => ({ precall: runMode("precall", rubric), insample: runMode("insample", rubric), stated: runMode("stated", rubric) }), [rubric]);
  const rows = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced()) return;
      gsap.fromTo("[data-bar]", { scaleX: 0 }, { scaleX: 1, transformOrigin: "0 50%", duration: 1, stagger: 0.04, ease: "expo.out" });
      gsap.fromTo("[data-mark]", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.04, delay: 0.4, ease: "back.out(3)" });
    },
    { scope: rows, dependencies: [mode], revertOnUpdate: true },
  );

  const evidence = apps.flatMap((a) => a.assessments.flatMap((x) => x.evidence));
  const sourced = evidence.filter((e) => e.source.length > 0).length / Math.max(1, evidence.length);
  const pc = all.precall;
  const yesMissPre = pc.rows.filter((r) => r.memo.decision === "INVESTED" && r.call === "pass").length;
  const passAdvPre = pc.rows.filter((r) => r.memo.decision === "PASSED" && r.call === "advance").length;
  const talkbook = apps.find((a) => a.id === "talkbook");

  const contract = [
    { metric: "Lean-pass on a company the fund backed", threshold: "0 of 6", result: `${yesMissPre} of 6`, pass: yesMissPre === 0, why: "The most expensive error. Pre-call test." },
    { metric: "'Take the call' on a company the fund passed", threshold: "0 of 6", result: `${passAdvPre} of 6`, pass: passAdvPre === 0, why: "Wastes partner time and erodes trust." },
    { metric: "Agreement on pre-call information", threshold: "≥ 75%", result: `${Math.round((pc.strict / pc.total) * 100)}% (${pc.strict}/${pc.total})`, pass: pc.strict / pc.total >= 0.75, why: "Borderline counts as disagreement." },
    { metric: "Scored claims carrying a source", threshold: "100%", result: `${Math.round(sourced * 100)}% of ${evidence.length}`, pass: sourced === 1, why: "Every claim traceable, per the brief." },
    { metric: "Known portfolio conflict caught (MeetRecord)", threshold: "1 of 1", result: talkbook?.gates.some((g) => g.kind === "portfolio_conflict") ? "1 of 1" : "0 of 1", pass: !!talkbook?.gates.some((g) => g.kind === "portfolio_conflict"), why: "Meeting 4 near-miss, re-run." },
    { metric: "Shadow quarter alongside Riya", threshold: "≥ 60 apps, ≥ 80% agreement, 0 yes-misses", result: "Not started", pass: null, why: "Only after this does Riya's triage switch off." },
  ];

  // slope chart data
  const slope = MEMOS.map((m) => ({ m, s: scoreMemo(m, "stated", rubric).composite, r: scoreMemo(m, "revealed", rubric).composite }));
  const sy = (v: number) => 370 - ((v - 3.4) / 4.6) * 320;

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 pt-14">
      <div className="eyebrow mb-4">Backtest · 12 real decisions</div>
      <SplitHeading className="display text-[clamp(44px,7vw,96px)] max-w-5xl">
        “Tell me how often it disagrees with us. And whether we were wrong or it was.”
      </SplitHeading>

      <p className="mt-6 text-[13px] text-muted">
        Scored with rubric <b className="text-ink">{(allRubricVersions.find((v) => v.id === activeRubricId) ?? allRubricVersions[0]).name}</b>.{" "}
        <a href="/rubric" className="underline-link text-ink">
          Change the rubric →
        </a>
      </p>

      {/* headline numbers per mode */}
      <Reveal className="mt-12 grid gap-3 md:grid-cols-3">
        {(Object.keys(MODES) as Mode[]).map((k) => {
          const b = all[k];
          return (
            <button key={k} data-reveal onClick={() => setMode(k)} className={`card p-6 text-left transition-all ${mode === k ? "!border-go" : "hover:border-line-2"}`}>
              <div className="flex items-center justify-between">
                <span className="eyebrow">{MODES[k].label}</span>
                {mode === k && <span className="pill tone-go !text-[10px] !py-0">viewing</span>}
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <CountUp to={b.strict} className="text-5xl" />
                <span className="num text-muted">/ {b.total} agree</span>
              </div>
              <div className="mt-2 text-[12px] text-muted">
                {b.borderline} sent to partner review · {b.hardMisses.length} hard misses
              </div>
              <p className="mt-3 text-[12px] text-faint leading-snug">{MODES[k].blurb}</p>
            </button>
          );
        })}
      </Reveal>

      {/* rows */}
      <section className="mt-12">
        <div ref={rows} className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-[180px_100px_1fr_150px_60px] gap-4 px-5 py-3 border-b border-line eyebrow">
            <span>Company</span>
            <span>Fund said</span>
            <span>
              Composite (review ≥ {THRESHOLDS.review}, call ≥ {THRESHOLDS.takeCall})
            </span>
            <span>Desk says</span>
            <span />
          </div>
          {bt.rows.map(({ memo, result, call, agrees }) => (
            <div key={memo.id} className="grid gap-2 md:gap-4 md:grid-cols-[180px_100px_1fr_150px_60px] items-center px-5 py-3.5 border-b border-line last:border-0">
              <div>
                <div className="font-medium text-[14px]">{memo.name}</div>
                <div className="text-[11px] text-muted">{memo.sector}</div>
              </div>
              <span className={`pill !text-[11px] !py-0 w-fit ${memo.decision === "INVESTED" ? "tone-go" : "tone-pass"}`}>{memo.decision === "INVESTED" ? "Invested" : "Passed"}</span>
              <div className="relative h-6">
                <div className="absolute inset-y-2 left-0 right-0 rounded-full bg-white/[0.05]" />
                <div data-bar className="absolute inset-y-2 left-0 rounded-full" style={{ width: `${result.composite * 10}%`, background: `var(--${REC_COPY[result.recommendation].tone})`, opacity: 0.85 }} />
                <div className="absolute inset-y-0 border-l border-dashed border-review/60" style={{ left: `${THRESHOLDS.review * 10}%` }} />
                <div className="absolute inset-y-0 border-l border-dashed border-go/70" style={{ left: `${THRESHOLDS.takeCall * 10}%` }} />
                <span data-mark className="absolute -top-0.5 num text-[11px] text-ink" style={{ left: `calc(${result.composite * 10}% + 6px)` }}>
                  {result.composite.toFixed(1)}
                </span>
              </div>
              <span className="text-[13px]">{call === "advance" ? "Take the call" : call === "borderline" ? "Partner review" : "Pass"}</span>
              <span data-mark className={`num text-lg ${agrees ? "text-go" : call === "borderline" ? "text-review" : "text-critical"}`}>{agrees ? "✓" : call === "borderline" ? "~" : "✗"}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Who was wrong */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Disagreements" title="Who was wrong — the fund, or the desk?" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[
              {
                h: "Stated thesis lets four passes through",
                tag: "Fund was right",
                tone: "go",
                b: "Under the public wording, Petalry, CampusCredit, AeroDrop and Prepnest land in partner review instead of pass. In each, the deciding factor — repeat rate, owning credit risk, a regulator path, retention — appears nowhere in the written thesis. This matches Riya's own first-pass scores (Petalry 6.5, AeroDrop 7.5) that the partners marked down. The written thesis is out of date; the fund's behaviour is consistent.",
              },
              {
                h: "Pre-call: three yeses go to review, not call",
                tag: "Neither — correctly unsure",
                tone: "review",
                b: "ePlane, Wint Wealth and SuperK were won in the room: a milestone answer, manual-first selling, months in small-town stores. A deck can't show that, so the desk sends them to a partner rather than guessing. That is the boundary of the tool, and the reason founder-led bets should always get a partner read.",
              },
              {
                h: "Prepnest — Kushal's uneasy pass",
                tag: "Desk agrees with the fund",
                tone: "mandate",
                b: "The desk passes Prepnest in every mode (4.4–5.5). On the information at the time — no 30/90-day retention, defensive on copycat risk — it makes the same call. A competitor's later success says the category worked, not that Prepnest's retention did. Recommendation for Aditya's 'three uneasy passes' review: re-open only if Prepnest can now show retention.",
              },
              {
                h: "Ledgerly — the miss we can't test",
                tag: "Blind spot shared",
                tone: "critical",
                b: "Not in the memo pack. Kushal thinks it was a miss: a founder weak in the call whose company worked. The desk weights founder behaviour heavily, so it would likely repeat that miss. Until Riya digs out the notes, this is the one failure mode the backtest cannot see.",
              },
            ].map((x) => (
              <div key={x.h} data-reveal className="card p-6">
                <span className={`pill tone-${x.tone} !text-[11px]`}>{x.tag}</span>
                <h3 className="mt-3 text-xl font-medium">{x.h}</h3>
                <p className="mt-2 text-[14px] text-muted leading-relaxed">{x.b}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Slope chart */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Drift, measured" title="Stated vs revealed thesis, company by company">
            Riya&apos;s observation from Meeting 5, as numbers. Yeses (green) mostly rise or hold when you weight what the fund actually decided on; passes (red) fall. SuperK and Jai Kisan — two yeses that would
            have scored lower against the public wording — are the clearest cases.
          </SectionTitle>
          <SlopeChart data={slope} sy={sy} thresholds={THRESHOLDS} />
        </Reveal>
      </section>

      {/* Trust contract */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Agreed in advance" title="The trust contract">
            Thresholds written before the run, so the result can&apos;t be argued after it. Riya&apos;s triage stays on until every line passes, including the shadow quarter.
          </SectionTitle>
          <div className="card overflow-hidden">
            {contract.map((c) => (
              <div key={c.metric} data-reveal className="grid gap-2 sm:grid-cols-[1.4fr_1fr_1fr_90px] items-center px-5 py-4 border-b border-line last:border-0">
                <div>
                  <div className="text-[14px]">{c.metric}</div>
                  <div className="text-[11.5px] text-faint">{c.why}</div>
                </div>
                <div className="text-[13px] text-muted">
                  Threshold: <span className="text-ink num">{c.threshold}</span>
                </div>
                <div className="text-[13px] text-muted">
                  Result: <span className="text-ink num">{c.result}</span>
                </div>
                <span className={`pill !text-[11px] w-fit ${c.pass === null ? "tone-review" : c.pass ? "tone-go" : "tone-critical"}`}>{c.pass === null ? "Pending" : c.pass ? "Pass" : "Fail"}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Where it breaks */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="In writing" title="Exactly where it breaks" />
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ["Memo text is post-hoc", "Memos record the partners' reasoning, and the weights were derived from them. 12/12 in-sample proves consistency, not foresight."],
              ["Twelve is a tiny sample", "One flipped decision moves agreement by 8 points. Treat percentages as directional until the shadow quarter."],
              ["It can't see the room", "Risk ownership carries 20% of the score and mostly shows up in the call. From a deck the desk can only flag it, not judge it."],
              ["Founder backgrounds are unverifiable here", "All ten applicants list placeholder LinkedIn and website links. Integrity checks rely on deck-vs-form consistency — which caught EarnWise, but would miss a consistent lie."],
              ["The portfolio list is public and incomplete", "Conflict checks run against ~21 names found in press. Unannounced or older investments will be missed until the fund's own list is loaded."],
              ["Numbers are self-reported", "Most claims are founders' own words. Confidence scores of 50–70 say so; a high score is not a verified score."],
              ["Weights are judgement, not fit", "Hand-set from the memos. Corrections adjust scores for similar companies; they do not yet re-learn the weights."],
              ["Thesis drift is unresolved", "The desk scores against both lenses and says which one it used. Choosing between them is a partner decision."],
            ].map(([h, b]) => (
              <div key={h} data-reveal className="card p-5">
                <div className="font-medium">{h}</div>
                <p className="mt-1.5 text-[13.5px] text-muted leading-relaxed">{b}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>
    </div>
  );
}

/** Spread labels so none sit closer than `gap` px, keeping order. */
function dodge(ys: number[], gap = 15) {
  const idx = ys.map((y, i) => ({ y, i })).sort((a, b) => a.y - b.y);
  for (let k = 1; k < idx.length; k++) if (idx[k].y - idx[k - 1].y < gap) idx[k].y = idx[k - 1].y + gap;
  // re-centre the block so it doesn't drift down
  const shift = (idx.reduce((t, x) => t + x.y, 0) - ys.reduce((t, y) => t + y, 0)) / ys.length;
  const out: number[] = [];
  idx.forEach((x) => (out[x.i] = x.y - shift));
  return out;
}

function SlopeChart({ data, sy, thresholds: THRESHOLDS }: { data: { m: (typeof MEMOS)[number]; s: number; r: number }[]; sy: (v: number) => number; thresholds: Rubric["thresholds"] }) {
  const ref = useRef<SVGSVGElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      gsap.fromTo(
        ".slope-line",
        { drawSVG: "0%" },
        { drawSVG: "100%", duration: 1.4, stagger: 0.06, ease: "power2.inOut", scrollTrigger: { trigger: ref.current, start: "top 80%", once: true } },
      );
      gsap.fromTo(".slope-label", { opacity: 0 }, { opacity: 1, duration: 0.6, stagger: 0.04, delay: 0.8, scrollTrigger: { trigger: ref.current, start: "top 80%", once: true } });
    },
    { scope: ref },
  );
  const L = 200;
  const R = 640;
  const ly = dodge(data.map((d) => sy(d.s)));
  const ry = dodge(data.map((d) => sy(d.r)));
  return (
    <div className="card p-4 sm:p-8 overflow-x-auto">
      <svg ref={ref} viewBox="0 0 860 390" className="w-full min-w-[640px] h-auto">
        <text x={L} y={16} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[11px] tracking-widest">
          STATED
        </text>
        <text x={R} y={16} textAnchor="middle" className="fill-[var(--muted)] font-mono text-[11px] tracking-widest">
          REVEALED
        </text>
        <line x1={L} x2={L} y1={26} y2={380} stroke="var(--line-2)" />
        <line x1={R} x2={R} y1={26} y2={380} stroke="var(--line-2)" />
        {[THRESHOLDS.review, THRESHOLDS.takeCall].map((t) => (
          <g key={t}>
            <line x1={L} x2={R} y1={sy(t)} y2={sy(t)} stroke={t === THRESHOLDS.takeCall ? "var(--go)" : "var(--review)"} strokeOpacity={0.25} strokeDasharray="3 5" />
            <text x={(L + R) / 2} y={sy(t) - 4} textAnchor="middle" className="font-mono text-[10px]" fill={t === THRESHOLDS.takeCall ? "var(--go)" : "var(--review)"} opacity={0.6}>
              {t === THRESHOLDS.takeCall ? "call" : "review"} {t}
            </text>
          </g>
        ))}
        {data.map(({ m, s, r }, idx) => {
          const c = m.decision === "INVESTED" ? "var(--go)" : "var(--pass)";
          return (
            <g key={m.id}>
              <line className="slope-line" x1={L} y1={sy(s)} x2={R} y2={sy(r)} stroke={c} strokeWidth={1.6} strokeOpacity={0.8} />
              <circle cx={L} cy={sy(s)} r={3.5} fill={c} />
              <circle cx={R} cy={sy(r)} r={3.5} fill={c} />
              <line x1={L - 4} y1={sy(s)} x2={L - 8} y2={ly[idx]} stroke={c} strokeOpacity={0.4} />
              <text className="slope-label text-[11px]" x={L - 10} y={ly[idx] + 4} textAnchor="end" fill="var(--muted)">
                {m.name} <tspan className="font-mono" fill="var(--ink)">{s.toFixed(1)}</tspan>
              </text>
              <line x1={R + 4} y1={sy(r)} x2={R + 8} y2={ry[idx]} stroke={c} strokeOpacity={0.4} />
              <text className="slope-label text-[11px]" x={R + 10} y={ry[idx] + 4} fill="var(--muted)">
                <tspan className="font-mono" fill="var(--ink)">{r.toFixed(1)}</tspan> {m.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
