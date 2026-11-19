"use client";

import { useRef } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { REC_COPY } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { LENS_COPY } from "@/lib/thesis";
import type { Lens, Recommendation, Severity, SourceRef, Verification } from "@/lib/types";

export const toneVar = (tone: string) => `var(--${tone})`;

export function RecBadge({ rec, size = "md" }: { rec: Recommendation; size?: "sm" | "md" }) {
  const c = REC_COPY[rec];
  return (
    <span className={`pill tone-${c.tone} ${size === "sm" ? "!text-[11px] !px-2 !py-0.5" : ""}`}>
      <span className="dot" />
      {size === "sm" ? c.short : c.label}
    </span>
  );
}

export function ScoreRing({ value, rec, size = 96, stroke = 6, label = true }: { value: number; rec: Recommendation; size?: number; stroke?: number; label?: boolean }) {
  const ref = useRef<SVGCircleElement>(null);
  const txt = useRef<HTMLSpanElement>(null);
  const r = (size - stroke) / 2;
  const C = 2 * Math.PI * r;
  const tone = toneVar(REC_COPY[rec].tone);
  useGSAP(
    () => {
      if (!ref.current) return;
      const target = C * (1 - value / 10);
      if (reduced()) {
        gsap.set(ref.current, { strokeDashoffset: target });
        return;
      }
      gsap.fromTo(ref.current, { strokeDashoffset: C }, { strokeDashoffset: target, duration: 1.6, ease: "expo.out" });
      if (txt.current) {
        const o = { v: 0 };
        gsap.to(o, { v: value, duration: 1.6, ease: "expo.out", onUpdate: () => txt.current && (txt.current.textContent = o.v.toFixed(1)) });
      }
    },
    { dependencies: [value, C] },
  );
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <circle
          ref={ref}
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - value / 10)}
          style={{ filter: `drop-shadow(0 0 6px ${tone})` }}
        />
      </svg>
      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span ref={txt} className="num font-medium" style={{ fontSize: size * 0.28 }}>
            {value.toFixed(1)}
          </span>
          {size >= 80 && <span className="text-[10px] text-muted num -mt-0.5">/ 10</span>}
        </div>
      )}
    </div>
  );
}

const V_COPY: Record<Verification, { label: string; tone: string; tip: string }> = {
  consistent: { label: "Consistent", tone: "go", tip: "Matches across deck, form or arithmetic" },
  external: { label: "Public source", tone: "mandate", tip: "Checked against a public source or the fund's own record" },
  claimed: { label: "Self-reported", tone: "review", tip: "Founder's own words; not independently checked" },
  contradicted: { label: "Contradicted", tone: "critical", tip: "Deck, form or arithmetic disagree" },
  unverifiable: { label: "Could not verify", tone: "hold", tip: "We tried and could not check this" },
};

export function VerificationBadge({ v }: { v: Verification }) {
  const c = V_COPY[v];
  return (
    <span className={`pill tone-${c.tone} !text-[10.5px] !px-2 !py-0`} title={c.tip}>
      {c.label}
    </span>
  );
}

export const VERIFICATION_COPY = V_COPY;

const KIND_ICON: Record<SourceRef["kind"], string> = { deck: "▤", form: "☰", web: "↗", memo: "§", notes: "✎", derived: "∑" };

export function SourceChip({ s }: { s: SourceRef }) {
  const inner = (
    <>
      <span className="text-faint">{KIND_ICON[s.kind]}</span>
      <span className="truncate">{s.ref}</span>
    </>
  );
  const cls =
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-white/[0.02] px-2 py-0.5 text-[11.5px] text-muted hover:text-ink hover:border-line-2 transition-colors";
  return s.url ? (
    <a href={s.url} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

export function SeverityPill({ s }: { s: Severity }) {
  return <span className={`pill tone-${s} !text-[10.5px] uppercase tracking-wider !py-0`}>{s}</span>;
}

export function LensToggle({ compact = false }: { compact?: boolean }) {
  const { lens, setLens } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  useGSAP(
    () => {
      if (!knob.current || !ref.current) return;
      const btn = ref.current.querySelector<HTMLButtonElement>(`[data-lens="${lens}"]`);
      if (!btn) return;
      gsap.to(knob.current, { x: btn.offsetLeft - 4, width: btn.offsetWidth, duration: reduced() ? 0 : 0.5, ease: "expo.out" });
    },
    { dependencies: [lens], scope: ref },
  );
  return (
    <div ref={ref} className="relative inline-flex rounded-full border border-line-2 p-1 text-xs" title={LENS_COPY[lens].blurb}>
      <span ref={knob} className="absolute top-1 bottom-1 left-1 rounded-full bg-ink" style={{ width: 0 }} />
      {(["revealed", "stated"] as Lens[]).map((l) => (
        <button
          key={l}
          data-lens={l}
          onClick={() => setLens(l)}
          className={`relative z-10 rounded-full px-3 py-1.5 transition-colors ${lens === l ? "text-bg" : "text-muted hover:text-ink"}`}
        >
          {compact ? (l === "revealed" ? "Revealed" : "Stated") : LENS_COPY[l].label}
        </button>
      ))}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8 max-w-3xl" data-reveal>
      <div className="eyebrow mb-3">{eyebrow}</div>
      <h2 className="display text-4xl sm:text-5xl">{title}</h2>
      {children && <div className="mt-4 text-muted leading-relaxed">{children}</div>}
    </div>
  );
}
