"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { useStore } from "@/lib/store";
import type { Application } from "@/lib/types";
import { Reveal, SplitHeading } from "@/components/motion";
import { BatchIntake } from "@/components/BatchIntake";

const STEPS = ["Reading deck and form", "Cross-checking deck against form", "Recomputing the arithmetic", "Checking the portfolio for conflicts", "Scoring seven criteria", "Naming the gaps"];

export default function Intake() {
  const [deck, setDeck] = useState("");
  const [form, setForm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addApplication, apps } = useStore();
  const router = useRouter();
  const loader = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!busy || reduced()) return;
      gsap.fromTo("[data-step]", { opacity: 0.25 }, { opacity: 1, stagger: { each: 1.6, repeat: -1, yoyo: true }, duration: 0.8 });
      gsap.to("[data-scan]", { xPercent: 400, duration: 1.4, repeat: -1, ease: "sine.inOut", yoyo: true });
    },
    { scope: loader, dependencies: [busy], revertOnUpdate: true },
  );

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ deck, form }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      const app = json.application as Application;
      addApplication(app);
      router.push(`/applications/${app.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const added = apps.length - 10;

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-8 pt-14">
      <div className="eyebrow mb-4">Intake</div>
      <SplitHeading className="display text-[clamp(44px,7vw,88px)]">Drop in next week&apos;s whole pile.</SplitHeading>
      <Reveal>
        <p data-reveal className="mt-6 max-w-2xl text-muted leading-relaxed">
          Upload every deck and form PDF at once, or paste one application. The model is given the same seven criteria, partner rules, portfolio list and past decisions as the seeded batch, must cite a slide, field or
          calculation for every claim, and returns the same structure — which the same engine then scores. It runs on Google Gemini (free tier) by default, or Claude through Vercel AI Gateway if that key is set instead.
        </p>
      </Reveal>

      <div className="mt-10">
        <BatchIntake />
      </div>

      <div className="mt-14 eyebrow">Or paste one application</div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Deck text</span>
          <textarea className="input mt-2 h-72 font-mono text-[12.5px]" value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="Slide 1 — Company… Slide 2 — Problem…" />
        </label>
        <label className="block">
          <span className="eyebrow">Form response</span>
          <textarea className="input mt-2 h-72 font-mono text-[12.5px]" value={form} onChange={(e) => setForm(e.target.value)} placeholder="Company name… Founders… Customers… Revenue…" />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary !px-6 !py-3" onClick={run} disabled={busy || (deck.trim().length < 40 && form.trim().length < 40)}>
          {busy ? "Analysing…" : "Run triage"}
        </button>
        {added > 0 && <span className="text-[12px] text-muted">{added} application(s) added this session — they appear on the desk.</span>}
      </div>

      {busy && (
        <div ref={loader} className="mt-8 card p-6 overflow-hidden relative">
          <div data-scan className="absolute top-0 left-0 h-[2px] w-1/4 bg-go shadow-[0_0_12px_var(--go)]" />
          <ul className="space-y-2">
            {STEPS.map((s) => (
              <li key={s} data-step className="text-[13px] flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-go" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="mt-8 card p-5 border-review/40">
          <div className="eyebrow !text-review mb-1">Couldn&apos;t run</div>
          <p className="text-[13.5px]">{error}</p>
        </div>
      )}

      <div className="mt-16 card p-6">
        <div className="eyebrow mb-2">Limits of a live run</div>
        <ul className="space-y-1.5 text-[13.5px] text-muted">
          <li>• No web search in this route yet, so public enrichment (competitors, regulation, portfolio news) is listed as a gap rather than guessed.</li>
          <li>• Model output is scored by the same deterministic engine; the composite and recommendation are computed, not generated.</li>
          <li>• Added applications live in this browser only. <Link href="/" className="underline-link text-ink">Back to the desk →</Link></li>
        </ul>
      </div>
    </div>
  );
}
