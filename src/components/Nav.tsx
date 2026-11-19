"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { gsap, useGSAP, reduced } from "@/lib/gsap";
import { LensToggle } from "./ui";
import { useStore } from "@/lib/store";

const LINKS = [
  { href: "/", label: "Desk" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/rubric", label: "Rubric" },
  { href: "/backtest", label: "Backtest" },
  { href: "/thesis", label: "Thesis" },
  { href: "/memory", label: "Memory" },
  { href: "/intake", label: "Intake" },
];

export function Nav() {
  const path = usePathname();
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const { corrections } = useStore();

  useGSAP(
    () => {
      if (reduced()) return;
      gsap.from(ref.current, { y: -40, opacity: 0, duration: 1, ease: "expo.out" });
    },
    { scope: ref },
  );

  const active = (h: string) => (h === "/" ? path === "/" || path.startsWith("/applications") : path.startsWith(h));

  return (
    <header ref={ref} className="sticky top-0 z-50 border-b border-line bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-6 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-go text-[13px] font-bold text-bg">A</span>
          <span className="leading-none">
            <span className="block text-[13px] font-semibold">Triage Desk</span>
            <span className="block text-[10px] text-muted num tracking-wide">ALL IN CAPITAL</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`relative rounded-full px-3 py-1.5 text-[13px] transition-colors ${active(l.href) ? "text-ink bg-white/[0.06]" : "text-muted hover:text-ink"}`}
            >
              {l.label}
              {l.href === "/memory" && corrections.length > 0 && (
                <span className="ml-1.5 num rounded-full bg-go/20 px-1.5 text-[10px] text-go">{corrections.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="ml-auto hidden sm:block">
          <LensToggle compact />
        </div>
        <button className="md:hidden ml-auto sm:ml-0 btn !px-3 !py-1.5" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-line px-4 py-3 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={`rounded-lg px-3 py-2 text-sm ${active(l.href) ? "bg-white/[0.06]" : "text-muted"}`}>
              {l.label}
            </Link>
          ))}
          <div className="pt-2 sm:hidden">
            <LensToggle compact />
          </div>
        </div>
      )}
    </header>
  );
}
