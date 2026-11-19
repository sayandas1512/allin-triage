"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import type { CriterionResult } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { CRITERION } from "@/lib/thesis";
import type { Application, CriterionAssessment } from "@/lib/types";
import { GrowBar } from "../motion";
import { SourceChip, VerificationBadge } from "../ui";

const scoreTone = (n: number) => (n >= 7 ? "var(--go)" : n >= 5 ? "var(--review)" : "var(--pass)");

export function CriterionRow({ app, a, res, index }: { app: Application; a: CriterionAssessment | undefined; res: CriterionResult; index: number }) {
  const def = CRITERION[res.criterion];
  const [open, setOpen] = useState(index < 2);
  const [editing, setEditing] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const { lens, dismissed, toggleDismiss } = useStore();

  useGSAP(
    () => {
      const el = body.current;
      if (!el) return;
      if (reduced()) {
        gsap.set(el, { height: open ? "auto" : 0, opacity: open ? 1 : 0 });
        return;
      }
      gsap.to(el, { height: open ? "auto" : 0, opacity: open ? 1 : 0, duration: 0.55, ease: "expo.inOut" });
    },
    { dependencies: [open] },
  );

  const metric = def.sectorMetric?.[app.sectorActual];
  const appDismissed = dismissed[app.id] ?? [];

  return (
    <div data-reveal className="card overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left p-5 grid gap-4 sm:grid-cols-[1fr_220px_64px] items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="num text-[11px] text-faint">{String(index + 1).padStart(2, "0")}</span>
            <span className="font-medium">{def.name}</span>
            <span className="num text-[11px] text-muted">× {Math.round(res.weight * 100)}%</span>
          </div>
          <p className="mt-1 text-[12.5px] text-muted leading-snug">{def.question}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <GrowBar value={res.final} tone={scoreTone(res.final)} />
          <div className="flex justify-between text-[10.5px] text-faint num">
            <span>{res.criterion === "thesis_fit" ? `${lens} lens` : res.imputed ? "no evidence → drag" : `${a?.evidence.length ?? 0} claims`}</span>
            <span>adds {res.contribution.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="num text-2xl" style={{ color: scoreTone(res.final) }}>
            {res.final.toFixed(1)}
          </span>
          {res.adjustments.length > 0 && <div className="num text-[10px] text-muted">was {res.base}</div>}
        </div>
      </button>

      <div ref={body} className="overflow-hidden" style={{ height: index < 2 ? "auto" : 0, opacity: index < 2 ? 1 : 0 }}>
        <div className="border-t border-line px-5 pb-5 pt-4 space-y-4">
          {metric && (
            <div className="text-[12px] text-muted">
              Deciding metric for {app.sectorActual}: <span className="text-ink">{metric}</span>
            </div>
          )}
          {a && <p className="text-[14px] leading-relaxed text-ink/90">{a.rationale}</p>}

          {res.adjustments.length > 0 && (
            <div className="rounded-xl border border-go/30 bg-go/[0.05] p-3 space-y-2">
              <div className="eyebrow !text-go">Learned from past corrections</div>
              {res.adjustments.map((adj) => (
                <div key={adj.correctionId} className="flex flex-wrap items-start justify-between gap-2 text-[12.5px]">
                  <span>
                    <span className="num" style={{ color: adj.delta > 0 ? "var(--go)" : "var(--pass)" }}>
                      {adj.delta > 0 ? "+" : ""}
                      {adj.delta.toFixed(1)}
                    </span>{" "}
                    from {adj.author}&apos;s correction on <b>{adj.fromApp}</b> (matches {Math.round(adj.similarity * 100)}% of its tags): “{adj.reason}”
                  </span>
                  <button className="text-[11px] text-muted underline-link" onClick={() => toggleDismiss(app.id, adj.correctionId)}>
                    Doesn&apos;t apply here
                  </button>
                </div>
              ))}
            </div>
          )}
          {appDismissed.length > 0 && res.criterion === "founder_market" && (
            <button className="text-[11px] text-muted underline-link" onClick={() => appDismissed.forEach((id) => toggleDismiss(app.id, id))}>
              Restore {appDismissed.length} dismissed adjustment(s)
            </button>
          )}

          {a ? (
            <ul className="space-y-2.5">
              {a.evidence.map((e, i) => (
                <li key={i} className="grid gap-1.5 sm:grid-cols-[110px_1fr]">
                  <div>
                    <VerificationBadge v={e.verification} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] leading-snug">{e.claim}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {e.source.map((s, j) => (
                        <SourceChip key={j} s={s} />
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-review">No evidence found for this criterion. Scored at the missing-data floor.</p>
          )}

          <div className="pt-1">
            {editing ? (
              <CorrectionForm app={app} res={res} onDone={() => setEditing(false)} />
            ) : (
              <button className="btn !py-1.5 !text-[12px]" onClick={() => setEditing(true)}>
                ✎ Correct this score
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CorrectionForm({ app, res, onDone }: { app: Application; res: CriterionResult; onDone: () => void }) {
  const { addCorrection } = useStore();
  const [to, setTo] = useState(res.final);
  const [reason, setReason] = useState("");
  const [author, setAuthor] = useState<"Kushal" | "Aditya" | "Riya">("Riya");
  const [scope, setScope] = useState<"similar" | "this">("similar");
  const [tags, setTags] = useState<string[]>(app.tags.slice(0, 1));
  const ref = useRef<HTMLFormElement>(null);

  useGSAP(() => {
    if (!reduced()) gsap.from(ref.current, { y: 12, opacity: 0, duration: 0.5 });
  });

  return (
    <form
      ref={ref}
      className="rounded-xl border border-line-2 p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        addCorrection({ appId: app.id, appName: app.name, criterion: res.criterion, from: res.final, to, reason: reason.trim(), author, tags: scope === "similar" ? tags : [], scope });
        onDone();
      }}
    >
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted w-20">Score</span>
        <input type="range" min={0} max={10} step={0.5} value={to} onChange={(e) => setTo(Number(e.target.value))} className="flex-1" />
        <span className="num w-16 text-right">
          {res.final.toFixed(1)} → <b>{to.toFixed(1)}</b>
        </span>
      </div>
      <div>
        <label className="text-xs text-muted">Why, in one line (required — this is what gets reused)</label>
        <input className="input mt-1" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. First-loss credit by an unregistered lender is a structure problem, not a founder one" />
      </div>
      <div className="flex flex-wrap items-center gap-3 text-[12px]">
        <select className="input !w-auto !py-1.5" value={author} onChange={(e) => setAuthor(e.target.value as typeof author)}>
          <option>Riya</option>
          <option>Kushal</option>
          <option>Aditya</option>
        </select>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={scope === "similar"} onChange={() => setScope("similar")} /> Apply to similar companies
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={scope === "this"} onChange={() => setScope("this")} /> This company only
        </label>
      </div>
      {scope === "similar" && (
        <div>
          <div className="text-[11px] text-muted mb-1.5">Generalise to companies tagged (at least half must match):</div>
          <div className="flex flex-wrap gap-1.5">
            {app.tags.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]))}
                className={`pill !text-[11px] !py-0.5 ${tags.includes(t) ? "tone-go" : "text-muted"}`}
              >
                {tags.includes(t) ? "✓ " : ""}
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary !py-1.5 !text-[12px]" disabled={!reason.trim() || to === res.final || (scope === "similar" && tags.length === 0)}>
          Save correction
        </button>
        <button type="button" className="btn !py-1.5 !text-[12px]" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
