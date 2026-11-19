"use client";

import { useRef, type ReactNode, type ElementType } from "react";
import { gsap, ScrollTrigger, SplitText, useGSAP, reduced } from "@/lib/gsap";

/** Headline that rises in, line by line, character by character. */
export function SplitHeading({
  children,
  className = "",
  as: Tag = "h1",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!ref.current || reduced()) return;
      const split = SplitText.create(ref.current, { type: "lines,words", mask: "lines", linesClass: "pb-[0.08em]" });
      gsap.from(split.words, { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.035, ease: "expo.out", delay });
      return () => split.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/** Children with [data-reveal] fade up as they scroll into view, batched. */
export function Reveal({ children, className = "", stagger = 0.08 }: { children: ReactNode; className?: string; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (!ref.current || reduced()) return;
      const items = ref.current.querySelectorAll<HTMLElement>("[data-reveal]");
      const targets = items.length ? Array.from(items) : [ref.current];
      gsap.set(targets, { opacity: 0, y: 28 });
      ScrollTrigger.batch(targets, {
        start: "top 92%",
        once: true,
        onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, stagger, duration: 0.9, ease: "power3.out", overwrite: true }),
      });
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Number that counts up when it enters the viewport. */
export function CountUp({ to, decimals = 0, prefix = "", suffix = "", className = "" }: { to: number; decimals?: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => `${prefix}${n.toFixed(decimals)}${suffix}`;
  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (reduced()) {
        el.textContent = fmt(to);
        return;
      }
      const o = { v: 0 };
      gsap.to(o, {
        v: to,
        duration: 1.6,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 95%", once: true },
        onUpdate: () => (el.textContent = fmt(o.v)),
      });
    },
    { dependencies: [to], revertOnUpdate: true },
  );
  return (
    <span ref={ref} className={`num ${className}`}>
      {fmt(to)}
    </span>
  );
}

/** Horizontal bar that grows to `value` (0–10 or 0–1 via max). */
export function GrowBar({ value, max = 10, tone = "var(--go)", className = "", height = 6 }: { value: number; max?: number; tone?: string; className?: string; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  useGSAP(
    () => {
      if (!ref.current) return;
      if (reduced()) {
        gsap.set(ref.current, { width: `${pct}%` });
        return;
      }
      gsap.fromTo(
        ref.current,
        { width: "0%" },
        { width: `${pct}%`, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ref.current, start: "top 96%", once: true } },
      );
    },
    { dependencies: [pct] },
  );
  return (
    <div className={`w-full rounded-full bg-white/[0.06] overflow-hidden ${className}`} style={{ height }}>
      <div ref={ref} className="h-full rounded-full" style={{ background: tone, width: `${pct}%` }} />
    </div>
  );
}

/** Magnetic hover for buttons and cards. */
export function Magnetic({ children, strength = 0.25, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    (_, contextSafe) => {
      const el = ref.current;
      if (!el || reduced() || !contextSafe) return;
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "elastic.out(1, 0.4)" });
      const move = contextSafe((e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * strength);
        yTo((e.clientY - r.top - r.height / 2) * strength);
      });
      const leave = contextSafe(() => {
        xTo(0);
        yTo(0);
      });
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      };
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`inline-block ${className}`}>
      {children}
    </div>
  );
}
