import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Nav } from "@/components/Nav";
import { ChatDock } from "@/components/ChatDock";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Instrument_Serif({ variable: "--font-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: "Triage Desk · All In Capital",
  description: "Inbound applications scored against the fund's thesis, criterion by criterion, with a source behind every claim.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <Suspense fallback={<div className="sticky top-0 z-50 h-16 border-b border-line bg-bg/75" />}>
            <Nav />
          </Suspense>
          <main className="flex-1">{children}</main>
          <footer className="mx-auto w-full max-w-[1320px] px-4 sm:px-8 py-10 text-xs text-faint flex flex-wrap gap-x-6 gap-y-2 justify-between border-t border-line mt-24">
            <span>Triage Desk — a decision-support prototype. It recommends; partners decide.</span>
            <span className="num">Built from 12 deal memos · 5 partner meetings · 10 applications · public sources</span>
          </footer>
          <Suspense fallback={null}>
            <ChatDock />
          </Suspense>
        </StoreProvider>
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}
