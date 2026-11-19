"use client";

import { useMemo, useRef } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { REC_COPY } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Recommendation } from "@/lib/types";

const LANES: Recommendation[] = ["take_call", "partner_review", "hold_conflict", "out_of_mandate", "lean_pass"];
const W = 1000;
const H = 380;
const INBOX = { x: 70, y: H / 2 };
const PRISM = { x: 470, y: H / 2 };
const laneY = (i: number) => 52 + i * ((H - 104) / (LANES.length - 1));
const LANE_X = 860;

/**
 * Motion graphic: the week's pile leaves the inbox, passes through the thesis lens
 * (seven criteria), and lands in the lane the engine recommends. Re-runs on lens change.
 */
export function FlowGraphic() {
  const { apps, scoreOf, lens, ready } = useStore();
  const root = useRef<SVGSVGElement>(null);

  const routed = useMemo(
    () =>
      apps.map((a, i) => {
        const r = scoreOf(a);
        const lane = LANES.indexOf(r.recommendation);
        const ly = laneY(lane);
        const sy = INBOX.y - 60 + (i % 10) * 13;
        const d = `M ${INBOX.x + 20} ${sy} C 260 ${sy}, 330 ${PRISM.y}, ${PRISM.x - 46} ${PRISM.y} L ${PRISM.x + 46} ${PRISM.y} C 640 ${PRISM.y}, 700 ${ly}, ${LANE_X - 14} ${ly}`;
        return { a, r, lane, d, i };
      }),
    [apps, scoreOf],
  );

  const counts = LANES.map((l) => routed.filter((x) => x.r.recommendation === l).length);

  useGSAP(
    () => {
      const svg = root.current;
      if (!svg || !ready) return;
      const dots = gsap.utils.toArray<SVGCircleElement>(".flow-dot", svg);
      const paths = gsap.utils.toArray<SVGPathElement>(".flow-path", svg);
      const counters = gsap.utils.toArray<SVGTextElement>(".lane-count", svg);
      if (reduced()) {
        dots.forEach((d, i) => gsap.set(d, { motionPath: { path: paths[i], align: paths[i], alignOrigin: [0.5, 0.5], start: 1, end: 1 } }));
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
      tl.fromTo(".prism-ring", { scale: 0.6, opacity: 0, transformOrigin: "50% 50%" }, { scale: 1, opacity: 1, duration: 0.8, stagger: 0.08, ease: "back.out(2)" }, 0)
        .fromTo(paths, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.4, stagger: 0.05 }, 0.1)
        .fromTo(".lane", { opacity: 0, x: 20 }, { opacity: 1, x: 0, stagger: 0.06, duration: 0.6 }, 0.3);
      dots.forEach((dot, i) => {
        tl.fromTo(
          dot,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.8,
            motionPath: { path: paths[i], align: paths[i], alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            ease: "power1.inOut",
          },
          0.6 + i * 0.12,
        );
      });
      counters.forEach((c) => {
        const n = Number(c.dataset.n);
        const o = { v: 0 };
        tl.to(o, { v: n, duration: 1.2, ease: "power1.out", onUpdate: () => (c.textContent = String(Math.round(o.v))) }, 1.4);
      });
      // ambient pulse on the prism
      gsap.to(".prism-core", { opacity: 0.55, scale: 1.08, transformOrigin: "50% 50%", repeat: -1, yoyo: true, duration: 1.8, ease: "sine.inOut" });
    },
    { scope: root, dependencies: [lens, ready, routed.length], revertOnUpdate: true },
  );

  return (
    <svg ref={root} viewBox={`0 0 ${W} ${H}`} className="w-full h-auto select-none" role="img" aria-label="Applications flowing from inbox through the thesis lens into recommendation lanes">
      <defs>
        <radialGradient id="prismGlow">
          <stop offset="0%" stopColor="var(--go)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--go)" stopOpacity="0" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* inbox */}
      <g>
        <rect x={INBOX.x - 40} y={INBOX.y - 82} width={80} height={164} rx={14} fill="var(--panel-2)" stroke="var(--line-2)" />
        <text x={INBOX.x} y={INBOX.y + 104} textAnchor="middle" className="fill-[var(--muted)] text-[11px] tracking-[0.14em] font-mono">
          INBOX · {apps.length}
        </text>
      </g>

      {/* paths */}
      {routed.map(({ a, r, d }) => (
        <path key={a.id} className="flow-path" d={d} fill="none" stroke={`var(--${REC_COPY[r.recommendation].tone})`} strokeOpacity={0.22} strokeWidth={1.2} />
      ))}

      {/* prism */}
      <g>
        <circle cx={PRISM.x} cy={PRISM.y} r={110} fill="url(#prismGlow)" className="prism-core" />
        {[0, 1, 2].map((k) => (
          <circle key={k} className="prism-ring" cx={PRISM.x} cy={PRISM.y} r={46 + k * 14} fill="none" stroke="var(--go)" strokeOpacity={0.35 - k * 0.1} strokeDasharray={k === 1 ? "2 6" : undefined} />
        ))}
        {Array.from({ length: 7 }).map((_, k) => {
          const ang = (k / 7) * Math.PI * 2 - Math.PI / 2;
          return <circle key={k} className="prism-ring" cx={PRISM.x + Math.cos(ang) * 46} cy={PRISM.y + Math.sin(ang) * 46} r={3} fill="var(--go)" />;
        })}
        <text x={PRISM.x} y={PRISM.y + 4} textAnchor="middle" className="fill-[var(--ink)] text-[12px] font-mono tracking-[0.1em]">
          THESIS
        </text>
        <text x={PRISM.x} y={PRISM.y + 104} textAnchor="middle" className="fill-[var(--muted)] text-[11px] tracking-[0.14em] font-mono">
          7 CRITERIA · {lens.toUpperCase()}
        </text>
      </g>

      {/* lanes */}
      {LANES.map((l, i) => (
        <g key={l} className="lane">
          <rect x={LANE_X - 12} y={laneY(i) - 15} width={W - LANE_X + 4} height={30} rx={15} fill="var(--panel-2)" stroke={`var(--${REC_COPY[l].tone})`} strokeOpacity={0.4} />
          <text x={LANE_X + 10} y={laneY(i) + 4} className="text-[11.5px]" fill={`var(--${REC_COPY[l].tone})`}>
            {REC_COPY[l].short}
          </text>
          <text x={W - 20} y={laneY(i) + 4} textAnchor="end" className="lane-count num text-[13px] font-mono" fill="var(--ink)" data-n={counts[i]}>
            {counts[i]}
          </text>
        </g>
      ))}

      {/* dots */}
      {routed.map(({ a, r }) => (
        <circle key={a.id} className="flow-dot" r={5} fill={`var(--${REC_COPY[r.recommendation].tone})`} filter="url(#glow)" cx={0} cy={0} opacity={0}>
          <title>{a.name}</title>
        </circle>
      ))}
    </svg>
  );
}
