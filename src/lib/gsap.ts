"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, Flip, MotionPathPlugin, DrawSVGPlugin, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });
  if (process.env.NODE_ENV === "development") (window as unknown as { __gsap: typeof gsap }).__gsap = gsap;
}

export const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, SplitText, Flip, MotionPathPlugin, useGSAP };
