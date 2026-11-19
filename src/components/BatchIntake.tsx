"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { REC_COPY } from "@/lib/engine";
import { useStore } from "@/lib/store";
import type { Application } from "@/lib/types";

/**
 * "Takes a week of intake — not one deck, the whole pile."
 * Drop every deck and form PDF at once. Files are paired by company name, text is extracted
 * server-side, then each pair runs through research + scoring with limited concurrency.
 */
type Status = "extracting" | "ready" | "queued" | "analysing" | "done" | "failed";
interface Doc {
  name: string;
  text: string;
  pages: number;
}
interface Item {
  key: string;
  company: string;
  deck?: Doc;
  form?: Doc;
  pending: number;
  status: Status;
  error?: string;
  appId?: string;
  startedAt?: number;
  seconds?: number;
}

const STOP = new Set(["deck", "pitch", "form", "response", "responses", "application", "app", "final", "v1", "v2", "pdf", "copy", "mesa", "t2", "case"]);

function parseName(file: string) {
  const stem = file.replace(/\.pdf$/i, "");
  const words = stem.split(/[_\-\s.]+/).filter(Boolean);
  // an explicit "deck"/"pitch" wins; then "form"/"response"; default deck
  const kind: "deck" | "form" = /deck|pitch/i.test(stem) ? "deck" : /form|response/i.test(stem) ? "form" : "deck";
  const nameWords = words.filter((w) => !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w));
  const company = nameWords.slice(0, 2).join(" ") || stem;
  return { key: company.toLowerCase().replace(/[^a-z0-9]+/g, ""), company, kind };
}

const CONCURRENCY = 2;

export function BatchIntake() {
  const { addApplication, scoreOf, apps } = useStore();
  const [items, setItems] = useState<Item[]>([]);
  const [drag, setDrag] = useState(false);
  const [running, setRunning] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Item[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const patch = (key: string, f: (i: Item) => Item) => setItems((xs) => xs.map((x) => (x.key === key ? f(x) : x)));

  useGSAP(
    () => {
      if (reduced()) return;
      gsap.to(".bar-run", { xPercent: 300, duration: 1.2, repeat: -1, ease: "sine.inOut", yoyo: true });
    },
    { scope: box, dependencies: [items.filter((i) => i.status === "analysing" || i.status === "extracting").length], revertOnUpdate: true },
  );
  useGSAP(
    () => {
      if (!reduced()) gsap.from("[data-row]", { y: 12, opacity: 0, stagger: 0.04, duration: 0.4 });
    },
    { scope: box, dependencies: [items.length] },
  );

  // tick elapsed seconds for running rows
  useEffect(() => {
    if (!items.some((i) => i.status === "analysing")) return;
    const t = setInterval(() => setItems((xs) => xs.map((x) => (x.status === "analysing" && x.startedAt ? { ...x, seconds: Math.round((Date.now() - x.startedAt) / 1000) } : x))), 1000);
    return () => clearInterval(t);
  }, [items]);

  async function addFiles(files: FileList | File[]) {
    const pdfs = Array.from(files).filter((f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
    if (!pdfs.length) return;
    // register rows first so the user sees the pairing immediately
    setItems((xs) => {
      const next = [...xs];
      for (const f of pdfs) {
        const p = parseName(f.name);
        const row = next.find((x) => x.key === p.key);
        if (row) {
          const i = next.indexOf(row);
          next[i] = { ...row, pending: row.pending + 1, status: "extracting" };
        } else next.push({ key: p.key, company: p.company, pending: 1, status: "extracting" });
      }
      return next;
    });
    let idx = 0;
    const worker = async () => {
      while (idx < pdfs.length) {
        const f = pdfs[idx++];
        const p = parseName(f.name);
        const fd = new FormData();
        fd.append("file", f);
        try {
          const res = await fetch("/api/extract", { method: "POST", body: fd });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
          const doc: Doc = { name: json.name, text: json.text, pages: json.pages };
          patch(p.key, (x) => {
            const slot = p.kind === "form" || (x.deck && !x.form && p.kind !== "deck") ? "form" : x.deck ? "form" : "deck";
            const pending = x.pending - 1;
            return { ...x, [slot]: doc, pending, status: pending > 0 ? "extracting" : x.status === "failed" ? "failed" : "ready" };
          });
        } catch (e) {
          patch(p.key, (x) => ({ ...x, pending: x.pending - 1, status: "failed", error: e instanceof Error ? e.message : String(e) }));
        }
      }
    };
    await Promise.all([worker(), worker(), worker()]);
  }

  async function analyseAll() {
    setRunning(true);
    const queue = (xs: Item[]) => xs.map((x) => (x.status === "ready" ? { ...x, status: "queued" as const } : x));
    itemsRef.current = queue(itemsRef.current);
    setItems(queue);
    const run = async () => {
      for (;;) {
        const next = itemsRef.current.find((x) => x.status === "queued");
        if (!next) return;
        itemsRef.current = itemsRef.current.map((x) => (x.key === next.key ? { ...x, status: "analysing" } : x));
        patch(next.key, (x) => ({ ...x, status: "analysing", startedAt: Date.now(), seconds: 0 }));
        try {
          const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ deck: next.deck?.text ?? "", form: next.form?.text ?? "" }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
          const app = json.application as Application;
          addApplication(app);
          patch(next.key, (x) => ({ ...x, status: "done", appId: app.id }));
        } catch (e) {
          patch(next.key, (x) => ({ ...x, status: "failed", error: e instanceof Error ? e.message : String(e) }));
        }
      }
    };
    await new Promise((r) => setTimeout(r, 50));
    await Promise.all(Array.from({ length: CONCURRENCY }, run));
    setRunning(false);
  }

  const ready = items.filter((i) => i.status === "ready").length;
  const done = items.filter((i) => i.status === "done").length;
  const total = items.length;

  return (
    <div ref={box} className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void addFiles(e.dataTransfer.files);
        }}
        onClick={() => input.current?.click()}
        className={`card cursor-pointer border-2 border-dashed p-10 text-center transition-colors ${drag ? "!border-go bg-go/[0.05]" : "hover:border-line-2"}`}
      >
        <div className="display text-3xl">Drop the whole pile</div>
        <p className="mt-2 text-[13px] text-muted">
          Every deck and form PDF at once. Files are paired by company name (e.g. <span className="num">GrainKind_Deck.pdf</span> + <span className="num">GrainKind_Form.pdf</span>).
        </p>
        <input ref={input} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={(e) => e.target.files && addFiles(e.target.files)} />
      </div>

      {total > 0 && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
            <span className="text-[13px] text-muted">
              <b className="text-ink num">{total}</b> companies · <b className="text-ink num">{done}</b> scored
            </span>
            <div className="flex gap-2">
              <button className="btn !text-[12px] !py-1.5" disabled={running} onClick={() => setItems([])}>
                Clear
              </button>
              <button className="btn btn-primary !text-[12px] !py-1.5" disabled={running || ready === 0} onClick={analyseAll}>
                {running ? "Analysing…" : `Analyse ${ready} ${ready === 1 ? "company" : "companies"}`}
              </button>
            </div>
          </div>
          <div className="divide-y divide-line">
            {items.map((i) => {
              const app = i.appId ? apps.find((a) => a.id === i.appId) : undefined;
              const r = app ? scoreOf(app) : undefined;
              return (
                <div key={i.key} data-row className="grid gap-2 px-5 py-3 sm:grid-cols-[160px_1fr_1fr_220px] items-center text-[12.5px]">
                  <span className="font-medium">{i.company}</span>
                  <span className={i.deck ? "text-ink/85" : "text-faint"}>{i.deck ? `▤ ${i.deck.name} · ${i.deck.pages}p` : "no deck"}</span>
                  <span className={i.form ? "text-ink/85" : "text-faint"}>{i.form ? `☰ ${i.form.name} · ${i.form.pages}p` : "no form"}</span>
                  <span>
                    {i.status === "done" && app && r ? (
                      <Link href={`/applications/${app.id}`} className="inline-flex items-center gap-2 hover:text-go">
                        <span className="num">{r.composite.toFixed(1)}</span>
                        <span className={`pill tone-${REC_COPY[r.recommendation].tone} !text-[10.5px] !py-0`}>{REC_COPY[r.recommendation].short}</span>→
                      </Link>
                    ) : i.status === "failed" ? (
                      <span className="text-critical" title={i.error}>
                        ✕ {i.error?.slice(0, 60)}
                      </span>
                    ) : i.status === "analysing" || i.status === "extracting" ? (
                      <span className="flex items-center gap-2">
                        <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                          <span className="bar-run absolute inset-y-0 left-0 w-1/4 rounded-full bg-go" />
                        </span>
                        <span className="text-muted">{i.status === "extracting" ? "reading PDF" : `researching & scoring · ${i.seconds ?? 0}s`}</span>
                      </span>
                    ) : (
                      <span className="text-muted">{i.status === "queued" ? "queued" : "ready"}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line px-5 py-2 text-[11px] text-faint">
            About 60–90 s per company (Google Search research + scoring), {CONCURRENCY} at a time. Free-tier limits apply on the public demo.
          </div>
        </div>
      )}
    </div>
  );
}
