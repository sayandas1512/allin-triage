"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { REC_COPY } from "@/lib/engine";
import { STAGE_COPY } from "@/lib/outreach";
import { weightsOf } from "@/lib/rubric";
import { useStore } from "@/lib/store";
import { CRITERION } from "@/lib/thesis";

/** Inline renderer: **bold**, [source refs] as chips, /applications/<id> as links, bullets. */
function renderInline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]\n]{2,90}\]|\/applications\/[a-z0-9-]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<b key={`${key}-${i++}`}>{t.slice(2, -2)}</b>);
    else if (t.startsWith("[")) {
      const md = t.match(/^\[([^\]]+)\]$/);
      out.push(
        <span key={`${key}-${i++}`} className="mx-0.5 inline-flex rounded border border-line px-1 text-[10.5px] text-muted align-middle">
          {md ? md[1] : t}
        </span>,
      );
    } else
      out.push(
        <Link key={`${key}-${i++}`} href={t} className="text-go underline-link">
          {t.replace("/applications/", "")}
        </Link>,
      );
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Rich({ text }: { text: string }) {
  // drop markdown link syntax around app paths: [Name](/applications/x) → Name /applications/x
  const clean = text.replace(/\[([^\]]+)\]\((\/applications\/[a-z0-9-]+)\)/g, "$1 $2");
  return (
    <div className="space-y-1.5">
      {clean.split(/\n+/).map((line, i) => {
        const bullet = line.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)$/);
        return bullet ? (
          <div key={i} className="flex gap-1.5">
            <span className="text-go">•</span>
            <span>{renderInline(bullet[1], `l${i}`)}</span>
          </div>
        ) : (
          <p key={i}>{renderInline(line, `l${i}`)}</p>
        );
      })}
    </div>
  );
}

const textOf = (m: UIMessage) => m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

export function ChatDock() {
  const path = usePathname();
  const store = useStore();
  const { apps, scoreOf, lens, decisions, outreach, corrections, rubric, allRubricVersions, activeRubricId, extra } = store;
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const currentApp = useMemo(() => {
    const id = path.startsWith("/applications/") ? path.split("/")[2] : null;
    return id ? apps.find((a) => a.id === id) : undefined;
  }, [path, apps]);

  /** Compact snapshot of the live desk, sent with every question (validated and capped server-side). */
  const snapshot = () => {
    const ver = allRubricVersions.find((v) => v.id === activeRubricId);
    const w = weightsOf(rubric, "revealed");
    return {
      page: path,
      lens,
      rubric: `${ver?.name ?? "v0"} — revealed weights ${Object.entries(w)
        .map(([k, v]) => `${CRITERION[k as keyof typeof CRITERION].short} ${Math.round(v * 100)}%`)
        .join(", ")}; review ≥ ${rubric.thresholds.review}, call ≥ ${rubric.thresholds.takeCall}; missing-data score ${rubric.missingDrag}`,
      scores: apps
        .map((a) => {
          const r = scoreOf(a);
          const s = scoreOf(a, lens === "revealed" ? "stated" : "revealed");
          return `${a.name} (${a.id}): ${r.composite} → ${REC_COPY[r.recommendation].label} · confidence ${r.confidence} · other lens ${s.composite} → ${REC_COPY[s.recommendation].label}`;
        })
        .join("\n"),
      decisions: Object.entries(decisions)
        .map(([id, d]) => `${id}: ${d}`)
        .join("\n"),
      outreach: Object.values(outreach)
        .map((o) => `${o.appId}: ${o.kind} · ${STAGE_COPY[o.stage].label}${o.booked ? ` · booked ${o.booked.label}` : ""}${o.agentNote ? ` · agent: ${o.agentNote}` : ""} · ${o.messages.length} messages`)
        .join("\n")
        .slice(0, 11_000),
      corrections: corrections.map((c) => `${c.author} on ${c.appName} · ${c.criterion} ${c.from}→${c.to}: "${c.reason}" (applies to: ${c.tags.join(", ") || "this company"})`).join("\n"),
      extraApps: extra.slice(-10),
    };
  };

  const ask = (q: string) => {
    const t = q.trim();
    if (!t || status === "streaming" || status === "submitted") return;
    sendMessage({ text: t }, { body: { state: snapshot() } });
    setInput("");
  };

  const suggestions = currentApp
    ? [`Why is ${currentApp.name} rated this way?`, `What couldn't the desk verify about ${currentApp.name}?`, `What should we ask ${currentApp.name} on the call?`]
    : path.startsWith("/backtest")
      ? ["Where does the desk disagree with past decisions, and who was right?", "How far can Kushal trust this, in numbers?"]
      : path.startsWith("/rubric")
        ? ["What happens if we lower the weight on risk ownership?", "Which criteria came from which past decisions?"]
        : path.startsWith("/pipeline")
          ? ["What is waiting on a partner right now?", "How does the booking agent handle a founder who asks about valuation?"]
          : ["Which applications should Kushal look at first, and why?", "Which deck-vs-form contradictions did the desk catch?", "Summarise this week's batch in five lines."];

  // open/close motion
  useGSAP(
    () => {
      if (!panel.current) return;
      if (reduced()) {
        gsap.set(panel.current, { autoAlpha: open ? 1 : 0 });
        return;
      }
      if (open) gsap.fromTo(panel.current, { autoAlpha: 0, y: 24, scale: 0.96, transformOrigin: "100% 100%" }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "expo.out" });
      else gsap.to(panel.current, { autoAlpha: 0, y: 16, scale: 0.97, duration: 0.25, ease: "power2.in" });
    },
    { dependencies: [open] },
  );

  // auto-scroll + entrance for new messages
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);
  useGSAP(
    () => {
      const el = list.current?.lastElementChild;
      if (el && !reduced()) gsap.from(el, { y: 10, opacity: 0, duration: 0.35, ease: "power2.out" });
    },
    { dependencies: [messages.length] },
  );

  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Ask the Desk"}
        className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-full border border-go/50 bg-panel-2/90 px-4 py-3 text-[13px] shadow-[0_0_30px_-8px_var(--go)] backdrop-blur-xl transition-transform hover:scale-[1.03]"
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-go text-[12px] font-bold text-bg">{open ? "×" : "?"}</span>
        <span className="hidden sm:inline">{open ? "Close" : "Ask the Desk"}</span>
      </button>

      <div
        ref={panel}
        role="dialog"
        aria-label="Ask the Desk assistant"
        className="invisible fixed bottom-20 right-3 sm:right-5 z-[70] flex h-[min(640px,calc(100vh-7rem))] w-[calc(100vw-1.5rem)] sm:w-[420px] flex-col overflow-hidden rounded-2xl border border-line-2 bg-panel/95 shadow-2xl backdrop-blur-xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <div className="text-[14px] font-medium">Ask the Desk</div>
            <div className="text-[10.5px] text-faint leading-snug">
              Answers only from the desk&apos;s data, with sources. Read-only — it can&apos;t send, book or change scores. Partners decide.
            </div>
          </div>
          {messages.length > 0 && (
            <button className="text-[11px] text-muted underline-link shrink-0" onClick={() => setMessages([])}>
              Clear
            </button>
          )}
        </header>

        <div ref={list} className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[13px] leading-relaxed">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-muted">
                {currentApp ? (
                  <>
                    Ask anything about <b className="text-ink">{currentApp.name}</b> or the rest of the batch.
                  </>
                ) : (
                  "Ask about this week's applications, past decisions, the thesis, the rubric or how to use the desk."
                )}
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => ask(s)} className="rounded-xl border border-line px-3 py-2 text-left text-[12.5px] text-ink/85 hover:border-go/60 hover:text-ink transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={m.role === "user" ? "ml-8 rounded-2xl rounded-br-md bg-go/15 px-3 py-2" : "mr-2"}>
              {m.role === "user" ? (
                textOf(m)
              ) : (
                <Fragment>
                  <div className="eyebrow !text-[9.5px] mb-1">Desk</div>
                  <Rich text={textOf(m)} />
                </Fragment>
              )}
            </div>
          ))}
          {status === "submitted" && <div className="text-[12px] text-muted animate-pulse">Reading the desk…</div>}
          {error && <div className="rounded-xl border border-critical/40 p-2 text-[12px] text-critical">{error.message.includes("429") || /Too many/.test(error.message) ? "Rate limit reached on the demo — try again shortly." : "Something went wrong. Please try again."}</div>}
        </div>

        <form
          className="flex items-end gap-2 border-t border-line p-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(input);
              }
            }}
            rows={1}
            placeholder="Ask about an application, a score, a past decision…"
            className="input !py-2 !text-[13px] max-h-28 resize-none"
          />
          {busy ? (
            <button type="button" className="btn !py-2 !text-[12px]" onClick={() => stop()}>
              Stop
            </button>
          ) : (
            <button type="submit" className="btn btn-primary !py-2 !text-[12px]" disabled={!input.trim()}>
              Ask
            </button>
          )}
        </form>
      </div>
    </>
  );
}
