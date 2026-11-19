"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { backtest, REC_COPY, scoreApplication } from "@/lib/engine";
import { MEMO, MEMOS } from "@/lib/memos";
import { BASELINE_VERSION, cloneRubric, diffRubric, sameRubric, weightsOf, type Rubric, type RubricVersion } from "@/lib/rubric";
import { useStore } from "@/lib/store";
import { CRITERIA, LENS_COPY } from "@/lib/thesis";
import type { Lens, Memo } from "@/lib/types";
import { SplitHeading } from "@/components/motion";
import { RecBadge } from "@/components/ui";

const precall = (ms: Memo[]) => ms.map((m) => ({ ...m, scores: { ...m.scores, risk_ownership: 5 } }));

function runAll(r: Rubric) {
  const pre = backtest(precall(MEMOS), "revealed", r);
  const ins = backtest(MEMOS, "revealed", r);
  const st = backtest(MEMOS, "stated", r);
  const yesMiss = pre.rows.filter((x) => x.memo.decision === "INVESTED" && x.call === "pass").length;
  const passAdv = pre.rows.filter((x) => x.memo.decision === "PASSED" && x.call === "advance").length;
  return { pre, ins, st, yesMiss, passAdv, contractOk: yesMiss === 0 && passAdv === 0 && pre.strict / pre.total >= 0.75 };
}

/** Number that tweens to its new value whenever it changes. */
function Tween({ v, d = 0, className = "" }: { v: number; d?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef(v);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const o = { n: last.current };
      last.current = v;
      if (reduced()) {
        el.textContent = v.toFixed(d);
        return;
      }
      gsap.to(o, { n: v, duration: 0.6, ease: "power2.out", onUpdate: () => (el.textContent = o.n.toFixed(d)) });
    },
    { dependencies: [v] },
  );
  return (
    <span ref={ref} className={`num ${className}`}>
      {v.toFixed(d)}
    </span>
  );
}

export default function RubricPage() {
  const { rubric, allRubricVersions, activeRubricId, saveRubric, activateRubric, apps, corrections, dismissed, lens: viewLens } = useStore();
  const [draft, setDraft] = useState<Rubric>(() => cloneRubric(rubric));
  const [lens, setLens] = useState<Lens>("revealed");
  const [note, setNote] = useState("");
  const [author, setAuthor] = useState<RubricVersion["author"]>("Kushal");
  const changesRef = useRef<HTMLDivElement>(null);

  // when the active version changes (activate / save), reset the draft to it
  const activeKey = activeRubricId;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync draft to the newly active version
    setDraft(cloneRubric(rubric));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  const dirty = !sameRubric(draft, rubric);
  const now = useMemo(() => runAll(rubric), [rubric]);
  const next = useMemo(() => runAll(draft), [draft]);
  const w = weightsOf(draft, lens);
  const wNow = weightsOf(rubric, lens);
  const diff = diffRubric(rubric, draft);

  const moved = useMemo(
    () =>
      apps
        .map((a) => {
          const before = scoreApplication(a, viewLens, corrections, dismissed[a.id] ?? [], rubric);
          const after = scoreApplication(a, viewLens, corrections, dismissed[a.id] ?? [], draft);
          return { a, before, after };
        })
        .filter((x) => x.before.recommendation !== x.after.recommendation || Math.abs(x.before.composite - x.after.composite) >= 0.1)
        .sort((x, y) => Number(y.before.recommendation !== y.after.recommendation) - Number(x.before.recommendation !== x.after.recommendation)),
    [apps, viewLens, corrections, dismissed, rubric, draft],
  );
  const flipped = moved.filter((x) => x.before.recommendation !== x.after.recommendation);
  const memoFlips = next.pre.rows.filter((r, i) => r.call !== now.pre.rows[i].call);

  useGSAP(
    () => {
      if (reduced()) return;
      gsap.from("[data-flip-row]", { x: 16, opacity: 0, stagger: 0.04, duration: 0.45, ease: "power2.out" });
    },
    { scope: changesRef, dependencies: [flipped.map((f) => f.a.id + f.after.recommendation).join()], revertOnUpdate: true },
  );

  const setPoints = (id: string, v: number) => setDraft((d) => ({ ...d, points: { ...d.points, [lens]: { ...d.points[lens], [id]: v } } }));
  const setT = (k: "takeCall" | "review", v: number) =>
    setDraft((d) => {
      const t = { ...d.thresholds, [k]: v };
      if (k === "review" && t.review > t.takeCall - 0.5) t.takeCall = Math.min(9.5, t.review + 0.5);
      if (k === "takeCall" && t.takeCall < t.review + 0.5) t.review = Math.max(1, t.takeCall - 0.5);
      return { ...d, thresholds: t };
    });

  const active = allRubricVersions.find((v) => v.id === activeRubricId) ?? BASELINE_VERSION;

  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 pt-14">
      <div className="eyebrow mb-4 flex flex-wrap items-center gap-2">
        Define the rubric · whiteboard box 1
        <span className="pill tone-go !text-[11px] !py-0">active: {active.name}</span>
      </div>
      <SplitHeading className="display text-[clamp(44px,7vw,92px)] max-w-5xl">Change how the fund scores — and see what it would have changed.</SplitHeading>
      <p className="mt-5 max-w-2xl text-muted leading-relaxed">
        Every score on the desk, the pipeline and the backtest is computed with the active rubric. Edits stay a draft until you save them as a version with a reason, so any number can be traced to the
        rubric that produced it — and rolled back.
      </p>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_400px] items-start">
        {/* Editor */}
        <div className="space-y-6 min-w-0">
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="eyebrow">Criterion weights</div>
                <p className="mt-1 text-[12px] text-faint max-w-md">{LENS_COPY[lens].blurb}</p>
              </div>
              <div className="inline-flex rounded-full border border-line-2 p-1 text-xs">
                {(["revealed", "stated"] as Lens[]).map((l) => (
                  <button key={l} onClick={() => setLens(l)} className={`rounded-full px-3 py-1.5 transition-colors ${lens === l ? "bg-ink text-bg" : "text-muted hover:text-ink"}`}>
                    {LENS_COPY[l].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {CRITERIA.map((c) => {
                const pts = draft.points[lens][c.id];
                const pct = Math.round(w[c.id] * 100);
                const was = Math.round(wNow[c.id] * 100);
                return (
                  <div key={c.id} className="grid gap-2 sm:grid-cols-[200px_1fr_110px] items-center">
                    <div>
                      <div className="text-[14px] font-medium">{c.name}</div>
                      <div className="text-[11px] text-faint">{c.learnedFrom.map((m) => MEMO[m]?.name).filter(Boolean).slice(0, 3).join(" · ")}</div>
                    </div>
                    <div className="relative">
                      <input type="range" min={0} max={40} step={1} value={pts} onChange={(e) => setPoints(c.id, Number(e.target.value))} className="w-full" aria-label={`${c.name} weight`} />
                      <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-go transition-[width] duration-300" style={{ width: `${Math.min(100, pct * 2.5)}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="num text-xl">{pct}%</span>
                      {pct !== was && (
                        <span className="num ml-1.5 text-[11px]" style={{ color: pct > was ? "var(--go)" : "var(--pass)" }}>
                          {pct > was ? "+" : ""}
                          {pct - was}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] text-faint">Sliders set importance points; weights are normalised to 100%. Setting a criterion to 0 removes it from the composite.</p>
          </section>

          <section className="card p-6 grid gap-6 sm:grid-cols-3">
            {(
              [
                ["review", "Partner review from", 2, 8, draft.thresholds.review, "var(--review)"],
                ["takeCall", "Take the call from", 3, 9.5, draft.thresholds.takeCall, "var(--go)"],
              ] as const
            ).map(([k, label, min, max, val, tone]) => (
              <div key={k}>
                <div className="eyebrow">{label}</div>
                <div className="mt-2 num text-3xl" style={{ color: tone }}>
                  {val.toFixed(1)}
                </div>
                <input type="range" min={min} max={max} step={0.1} value={val} onChange={(e) => setT(k, Number(e.target.value))} className="w-full mt-2" aria-label={label} />
              </div>
            ))}
            <div>
              <div className="eyebrow">Missing-data score</div>
              <div className="mt-2 num text-3xl text-review">{draft.missingDrag.toFixed(1)}</div>
              <input type="range" min={0} max={6} step={0.5} value={draft.missingDrag} onChange={(e) => setDraft((d) => ({ ...d, missingDrag: Number(e.target.value) }))} className="w-full mt-2" aria-label="Missing-data score" />
              <p className="mt-1 text-[11px] text-faint">Kushal: a missing number should drag, not be skipped.</p>
            </div>
          </section>

          <div className="flex flex-wrap gap-2">
            <button className="btn !text-[12px]" disabled={!dirty} onClick={() => setDraft(cloneRubric(rubric))}>
              Discard draft
            </button>
            <button className="btn !text-[12px]" disabled={sameRubric(draft, BASELINE_VERSION.rubric)} onClick={() => setDraft(cloneRubric(BASELINE_VERSION.rubric))}>
              Load baseline values
            </button>
          </div>

          {/* History */}
          <section className="pt-6">
            <div className="eyebrow mb-3">Version history</div>
            <div className="card divide-y divide-line">
              {[...allRubricVersions].reverse().map((v, i, arr) => {
                const prev = arr[i + 1];
                const changes = prev ? diffRubric(prev.rubric, v.rubric) : [];
                const isActive = v.id === activeRubricId;
                return (
                  <div key={v.id} className="p-5 grid gap-2 sm:grid-cols-[1fr_auto] items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{v.name}</span>
                        {isActive && <span className="pill tone-go !text-[10.5px] !py-0">active</span>}
                        <span className="text-[11px] text-faint">{new Date(v.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="mt-1 text-[13px] text-ink/85">“{v.note}”</p>
                      {changes.length > 0 && (
                        <ul className="mt-2 flex flex-wrap gap-1.5">
                          {changes.map((c) => (
                            <li key={c} className="pill !text-[10.5px] !py-0 text-muted">
                              {c}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {!isActive && (
                      <button className="btn !text-[12px] !py-1.5" onClick={() => activateRubric(v.id)}>
                        Activate
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Live impact */}
        <aside className="lg:sticky lg:top-24 space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Live impact</div>
              <span className={`pill !text-[11px] !py-0 ${dirty ? "tone-review" : "text-muted"}`}>{dirty ? "draft" : "no changes"}</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {(
                [
                  ["Pre-call", now.pre.strict, next.pre.strict],
                  ["In-sample", now.ins.strict, next.ins.strict],
                  ["Stated", now.st.strict, next.st.strict],
                ] as const
              ).map(([label, a, b]) => (
                <div key={label} className="rounded-xl border border-line p-3">
                  <div className="text-[10.5px] text-muted">{label}</div>
                  <div className="mt-1 text-2xl">
                    <Tween v={b} />
                    <span className="text-[12px] text-faint">/12</span>
                  </div>
                  {a !== b && (
                    <div className="num text-[11px]" style={{ color: b > a ? "var(--go)" : "var(--pass)" }}>
                      {b > a ? "+" : ""}
                      {b - a} vs active
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={`mt-4 rounded-xl border p-3 text-[12.5px] ${next.contractOk ? "border-go/40 bg-go/[0.05]" : "border-critical/50 bg-critical/[0.06]"}`}>
              <div className="font-medium">{next.contractOk ? "✓ Trust contract holds" : "✕ Trust contract broken"}</div>
              <ul className="mt-1 space-y-0.5 text-[12px] text-muted">
                <li>Lean-pass on a backed company: <b className={next.yesMiss ? "text-critical" : "text-ink"}>{next.yesMiss}</b> (must be 0)</li>
                <li>Call on a company we passed: <b className={next.passAdv ? "text-critical" : "text-ink"}>{next.passAdv}</b> (must be 0)</li>
                <li>
                  Pre-call agreement: <b className={next.pre.strict / next.pre.total < 0.75 ? "text-critical" : "text-ink"}>{Math.round((next.pre.strict / next.pre.total) * 100)}%</b> (≥ 75%)
                </li>
              </ul>
              {weightsOf(draft, "revealed").risk_ownership < weightsOf(rubric, "revealed").risk_ownership - 0.001 && (
                <div className="mt-2 rounded-lg border border-review/40 bg-review/[0.06] p-2 text-[11.5px] text-review">
                  Caution: the pre-call test sets risk ownership to neutral because it can&apos;t be seen before a call. Lowering its weight improves that test by construction, not because the rubric
                  got better. CampusCredit and AeroDrop were passed on exactly this criterion.
                </div>
              )}
              {memoFlips.length > 0 && (
                <div className="mt-2 text-[11.5px] text-muted">
                  Past decisions that move:{" "}
                  {memoFlips.map((r) => (
                    <span key={r.memo.id} className="mr-1.5">
                      {r.memo.name} ({r.memo.decision === "INVESTED" ? "yes" : "no"}) → {r.call}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div ref={changesRef} className="mt-4">
              <div className="eyebrow mb-2">This week&apos;s applications · {LENS_COPY[viewLens].label.toLowerCase()}</div>
              {moved.length === 0 ? (
                <p className="text-[12px] text-faint">No application moves.</p>
              ) : (
                <ul className="space-y-1.5">
                  {moved.slice(0, 8).map(({ a, before, after }) => (
                    <li key={a.id} data-flip-row className="flex items-center justify-between gap-2 text-[12.5px]">
                      <Link href={`/applications/${a.id}`} className="hover:text-go truncate">
                        {a.name}
                      </Link>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="num text-muted">{before.composite.toFixed(1)}→</span>
                        <span className="num">{after.composite.toFixed(1)}</span>
                        {before.recommendation !== after.recommendation ? (
                          <>
                            <RecBadge rec={before.recommendation} size="sm" />
                            <span className="text-faint">→</span>
                            <RecBadge rec={after.recommendation} size="sm" />
                          </>
                        ) : (
                          <span className="text-[10.5px] text-faint">{REC_COPY[after.recommendation].short}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <div className="eyebrow">Save as a new version</div>
            {diff.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {diff.map((d) => (
                  <li key={d} className="pill tone-review !text-[10.5px] !py-0">
                    {d}
                  </li>
                ))}
              </ul>
            )}
            <input className="input !text-[13px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why, in one line (required)" />
            <div className="flex flex-wrap items-center gap-2">
              <select className="input !w-auto !py-1.5 !text-[12px]" value={author} onChange={(e) => setAuthor(e.target.value as RubricVersion["author"])}>
                <option>Kushal</option>
                <option>Aditya</option>
                <option>Riya</option>
              </select>
              <button
                className="btn btn-primary !text-[12px] !py-1.5"
                disabled={!dirty || !note.trim()}
                onClick={() => {
                  saveRubric(cloneRubric(draft), note.trim(), author);
                  setNote("");
                }}
              >
                Save &amp; activate
              </button>
            </div>
            {!next.contractOk && dirty && <p className="text-[11.5px] text-critical">This draft breaks the trust contract. You can still save it; the backtest page will show it failing.</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
