"use client";

import { useRef } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { MEMO } from "@/lib/memos";
import { ANTI_THESIS, CRITERIA, PARTNER_RULES, PORTFOLIO, STATED_THESIS } from "@/lib/thesis";
import { weightsOf } from "@/lib/rubric";
import { useStore } from "@/lib/store";
import { GrowBar, Reveal, SplitHeading } from "@/components/motion";
import { SectionTitle, SourceChip } from "@/components/ui";

export default function Thesis() {
  const { rubric } = useStore();
  const WEIGHTS = { stated: weightsOf(rubric, "stated"), revealed: weightsOf(rubric, "revealed") };
  return (
    <div className="mx-auto max-w-[1320px] px-4 sm:px-8 pt-14">
      <div className="eyebrow mb-4">Thesis · reconstructed</div>
      <SplitHeading className="display text-[clamp(44px,7vw,96px)] max-w-5xl">
        Nobody wrote the rubric down. So we rebuilt it — and showed our sources.
      </SplitHeading>
      <Reveal>
        <p data-reveal className="mt-6 max-w-2xl text-muted leading-relaxed">
          The fund publishes no scoring rubric, ownership target or exclusion list. What follows is assembled from press and interviews (the <b className="text-ink">stated</b> thesis) and from the
          twelve memos and partner notes (the <b className="text-ink">revealed</b> thesis). Every application is scored against both, and the desk says which one it used.
        </p>
      </Reveal>

      {/* Stated */}
      <section className="pt-20">
        <Reveal>
          <SectionTitle eyebrow="What's public" title="The stated thesis" />
          <div className="card divide-y divide-line">
            {STATED_THESIS.map((s) => (
              <div key={s.k} data-reveal className="grid gap-3 p-5 md:grid-cols-[140px_1fr_auto] items-start">
                <div className="eyebrow !text-ink pt-0.5">{s.k}</div>
                <div className="text-[14.5px] leading-relaxed">{s.v}</div>
                <div className="flex flex-wrap gap-1.5 md:justify-end">
                  {s.src.map((x, i) => (
                    <SourceChip key={i} s={x} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div data-reveal className="mt-4 card p-5 border-review/30">
            <div className="eyebrow !text-review mb-2">Not public — and what that costs</div>
            <ul className="space-y-1.5 text-[13.5px] text-muted">
              <li>• <b className="text-ink">Ownership target:</b> unknown. The desk can&apos;t judge whether a round leaves enough room; capital-fit uses cheque size only.</li>
              <li>• <b className="text-ink">Formal exclusions:</b> none published (and Kushal prefers it that way). Anti-thesis below is inferred from passes and labelled as such.</li>
              <li>• <b className="text-ink">Full portfolio:</b> only ~21 names are public. Conflict checks are only as good as this list.</li>
              <li>• <b className="text-ink">Cheque size:</b> sources disagree ($150K average in 2023; up to ₹5 Cr for Fund II). The desk uses ₹5 Cr as the ceiling.</li>
            </ul>
          </div>
        </Reveal>
      </section>

      {/* Criteria */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Seven criteria" title="What each score means, and where it came from">
            Weights shown for both lenses. The revealed lens moves weight from sector labels to founder-owned risk and the deciding metric — which is what the memos actually turned on.
          </SectionTitle>
        </Reveal>
        <Reveal className="grid gap-4 md:grid-cols-2">
          {CRITERIA.map((c, i) => (
            <div key={c.id} data-reveal className="card p-6 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="num text-[11px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-lg font-medium">{c.name}</h3>
              </div>
              <p className="mt-2 text-[14px] text-ink/90">{c.question}</p>
              <p className="mt-2 text-[13px] text-muted leading-relaxed">{c.definition}</p>
              {c.sectorMetric && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                  {Object.entries(c.sectorMetric).map(([k, v]) => (
                    <div key={k} className="contents">
                      <span className="text-faint">{k}</span>
                      <span className="text-muted">{v}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 space-y-2">
                {(["stated", "revealed"] as const).map((l) => (
                  <div key={l} className="grid grid-cols-[70px_1fr_40px] items-center gap-3 text-[11.5px]">
                    <span className="text-muted capitalize">{l}</span>
                    <GrowBar value={WEIGHTS[l][c.id]} max={0.3} tone={l === "revealed" ? "var(--go)" : "var(--mandate)"} />
                    <span className="num text-right">{Math.round(WEIGHTS[l][c.id] * 100)}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
                {c.learnedFrom.map((m) => (
                  <span key={m} className={`pill !text-[11px] !py-0 ${MEMO[m]?.decision === "INVESTED" ? "tone-go" : "tone-pass"}`}>
                    § {MEMO[m]?.name}
                  </span>
                ))}
              </div>
              <div className="mt-2 text-[11.5px] text-faint">{c.publicAnchor}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* Anti-thesis + rules */}
      <section className="pt-24 grid gap-10 lg:grid-cols-2">
        <Reveal>
          <SectionTitle eyebrow="Inferred, not published" title="Anti-thesis" />
          <div className="space-y-3">
            {ANTI_THESIS.map((a) => (
              <div key={a.rule} data-reveal className="card p-5">
                <div className="font-medium">{a.rule}</div>
                <div className="mt-1 text-[12.5px] text-muted">{a.from}</div>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <SectionTitle eyebrow="From the partner notes" title="Rules the desk enforces" />
          <div className="space-y-3">
            {PARTNER_RULES.map((r) => (
              <div key={r.rule} data-reveal className="card p-5">
                <div className="text-[14px]">{r.rule}</div>
                <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                  <span className="pill !text-[11px] !py-0">{r.who}</span>
                  <SourceChip s={r.src} />
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Portfolio */}
      <section className="pt-24">
        <Reveal>
          <SectionTitle eyebrow="Conflict check runs against" title="The portfolio, as far as the public record shows">
            Every application is checked against this list. Meeting 4: “I would rather get a flag on a false alarm than miss a real conflict.”
          </SectionTitle>
        </Reveal>
        <Marquee />
        <Reveal className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PORTFOLIO.map((p) => (
            <div key={p.name} data-reveal className="card p-4 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-[14px]">{p.name}</div>
                <div className="text-[12px] text-muted">{p.what}</div>
              </div>
              {p.src.url ? (
                <a href={p.src.url} target="_blank" rel="noreferrer" className="text-faint hover:text-ink text-xs">
                  ↗
                </a>
              ) : (
                <span className="text-faint text-xs">§</span>
              )}
            </div>
          ))}
        </Reveal>
      </section>
    </div>
  );
}

function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (reduced()) return;
      const track = ref.current?.querySelector(".marquee-track");
      if (!track) return;
      gsap.to(track, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
    },
    { scope: ref },
  );
  const names = PORTFOLIO.map((p) => p.name);
  return (
    <div ref={ref} className="overflow-hidden border-y border-line py-6 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      <div className="marquee-track gap-12">
        {[...names, ...names].map((n, i) => (
          <span key={i} className="display text-4xl sm:text-5xl text-ink/80 whitespace-nowrap pr-12">
            {n} <span className="text-go">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
