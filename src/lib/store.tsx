"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { APPLICATIONS } from "./applications";
import { scoreApplication, type ScoreResult } from "./engine";
import { buildICS, generateSlots, type Slot } from "./schedule";
import { BASELINE_VERSION, type Rubric, type RubricVersion } from "./rubric";
import type { Application, Correction, DecisionState, Lens } from "./types";
import {
  DEFAULT_OUTREACH_SETTINGS,
  confirmationMessage,
  declineAckMessage,
  followUpMessage,
  founderEmail,
  inviteDraft,
  msgId,
  passDraft,
  type AgentDecision,
  type Author,
  type Draft,
  type Message,
  type Outreach,
  type OutreachKind,
  type OutreachSettings,
} from "./outreach";

interface Booking {
  slot: string;
  label: string;
  status: "tentative" | "confirmed";
}

interface State {
  lens: Lens;
  corrections: Correction[];
  decisions: Record<string, DecisionState>;
  /** correctionIds dismissed per application */
  dismissed: Record<string, string[]>;
  bookings: Record<string, Booking>;
  /** applications added through the intake page */
  extra: Application[];
  outreach: Record<string, Outreach>;
  /** Demo clock: days added to real time, to exercise "no reply for x days" without waiting */
  clockOffsetDays: number;
  outreachSettings: OutreachSettings;
  /** saved rubric versions after the baseline (v0) */
  rubricVersions: RubricVersion[];
  activeRubricId: string;
}

const KEY = "allin-triage:v1";

const DEFAULT: State = {
  lens: "revealed",
  corrections: [],
  decisions: {},
  dismissed: {},
  bookings: {},
  extra: [],
  outreach: {},
  clockOffsetDays: 0,
  outreachSettings: DEFAULT_OUTREACH_SETTINGS,
  rubricVersions: [],
  activeRubricId: BASELINE_VERSION.id,
};

const DAY = 86_400_000;

interface Ctx extends State {
  ready: boolean;
  apps: Application[];
  holds: Record<string, Slot>;
  now: number | null;
  /** real time + demo offset, ms; null before mount */
  clock: number | null;
  /** Tue/Thu slots not booked, held or offered to anyone (optionally ignoring one app's own offers) */
  freeSlots: (exceptApp?: string) => Slot[];
  startOutreach: (appId: string, kind: OutreachKind) => void;
  cancelOutreach: (appId: string) => void;
  updateDraft: (appId: string, d: Draft) => void;
  approveAndSend: (appId: string, by: Author) => void;
  founderReply: (appId: string, text: string) => Promise<AgentDecision | null>;
  sendPendingReply: (appId: string, by: Author, d: Draft) => void;
  advanceClock: (days: number) => void;
  /** the rubric every score in the app is computed with */
  rubric: Rubric;
  /** baseline first, then saved versions */
  allRubricVersions: RubricVersion[];
  saveRubric: (r: Rubric, note: string, author: RubricVersion["author"]) => void;
  activateRubric: (id: string) => void;
  setLens: (l: Lens) => void;
  addCorrection: (c: Omit<Correction, "id" | "createdAt">) => void;
  removeCorrection: (id: string) => void;
  setDecision: (appId: string, d: DecisionState) => void;
  toggleDismiss: (appId: string, correctionId: string) => void;
  book: (appId: string, b: Booking) => void;
  unbook: (appId: string) => void;
  addApplication: (a: Application) => void;
  reset: () => void;
  scoreOf: (a: Application, lens?: Lens) => ScoreResult;
}

const StoreCtx = createContext<{ live: Ctx; initial: Ctx } | null>(null);

/** Listeners that run synchronously before the lens changes (used to capture GSAP Flip state). */
const beforeLens = new Set<() => void>();
export function onBeforeLensChange(fn: () => void) {
  beforeLens.add(fn);
  return () => {
    beforeLens.delete(fn);
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(DEFAULT);
  const [ready, setReady] = useState(false);
  /** Read the clock only in the browser, after mount (never during prerender). */
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
       
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* storage unavailable: run in memory */
    }
    setNow(Date.now());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, ready]);

  const apps = useMemo(() => [...APPLICATIONS, ...state.extra], [state.extra]);

  const allRubricVersions = useMemo(() => [BASELINE_VERSION, ...state.rubricVersions], [state.rubricVersions]);
  const rubric = (allRubricVersions.find((v) => v.id === state.activeRubricId) ?? BASELINE_VERSION).rubric;

  const scoreOf = useCallback(
    (a: Application, lens?: Lens) => scoreApplication(a, lens ?? state.lens, state.corrections, state.dismissed[a.id] ?? [], rubric),
    [state.lens, state.corrections, state.dismissed, rubric],
  );

  const clock = now === null ? null : now + state.clockOffsetDays * DAY;
  const allSlots = useMemo(() => (now === null ? [] : generateSlots(new Date(now), 3)), [now]);

  /** Slots taken by confirmed bookings or by offers still open in an outreach thread. */
  const occupiedBy = useMemo(() => {
    const m = new Map<string, string>();
    for (const [id, b] of Object.entries(state.bookings)) m.set(b.slot, id);
    for (const o of Object.values(state.outreach)) {
      if (o.kind === "invite" && (o.stage === "draft" || o.stage === "awaiting_reply" || o.stage === "needs_human")) {
        for (const sl of o.offered) if (!m.has(sl.start)) m.set(sl.start, o.appId);
      }
    }
    return m;
  }, [state.bookings, state.outreach]);

  /**
   * "Promising applications already have a call on the calendar."
   * Every Take-the-call application without an outreach thread gets a tentative Tue/Thu slot.
   * Nothing is sent until a partner approves (Meeting 5: nobody is auto-advanced).
   */
  const holds = useMemo(() => {
    const out: Record<string, Slot> = {};
    if (clock === null) return out;
    const taken = new Set(occupiedBy.keys());
    const upcoming = allSlots.filter((sl) => new Date(sl.start).getTime() > clock);
    const ranked = apps
      .map((a) => ({ a, r: scoreOf(a) }))
      .filter(({ a, r }) => r.recommendation === "take_call" && !state.bookings[a.id] && !state.outreach[a.id] && state.decisions[a.id] !== "pass_confirmed")
      .sort((x, y) => y.r.composite - x.r.composite);
    for (const { a } of ranked) {
      const sl = upcoming.find((x) => !taken.has(x.start));
      if (!sl) break;
      taken.add(sl.start);
      out[a.id] = sl;
    }
    return out;
  }, [apps, scoreOf, state.bookings, state.decisions, state.outreach, occupiedBy, allSlots, clock]);

  const freeSlots = useCallback(
    (exceptApp?: string) => {
      if (clock === null) return [];
      const heldByOthers = new Set(Object.entries(holds).filter(([id]) => id !== exceptApp).map(([, sl]) => sl.start));
      return allSlots.filter((sl) => {
        const owner = occupiedBy.get(sl.start);
        return new Date(sl.start).getTime() > clock && (!owner || owner === exceptApp) && !heldByOthers.has(sl.start);
      });
    },
    [allSlots, occupiedBy, holds, clock],
  );

  const stamp = () => new Date(clock ?? Date.now()).toISOString();
  const out = (by: Author, m: Pick<Message, "subject" | "body">, note?: string): Message => ({
    id: msgId(),
    dir: "out",
    at: stamp(),
    by,
    ...m,
    delivery: "sending",
    note,
  });

  /** Whiteboard "Send Email": hand the message to /api/send-email and record what happened. */
  const dispatch = async (appId: string, m: Message, to: string, ics?: { filename: string; content: string }) => {
    let delivery: Message["delivery"] = "failed";
    let deliveryNote = "";
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to, subject: m.subject, body: m.body, ics }),
      });
      const json = await res.json();
      delivery = json.delivery ?? "failed";
      deliveryNote = json.note ?? json.error ?? "";
    } catch (e) {
      deliveryNote = e instanceof Error ? e.message : "network error";
    }
    setState((s) => {
      const o = s.outreach[appId];
      if (!o) return s;
      return { ...s, outreach: { ...s.outreach, [appId]: { ...o, messages: o.messages.map((x) => (x.id === m.id ? { ...x, delivery, deliveryNote } : x)) } } };
    });
  };

  /** Follow-ups already handed to the mailer, so a re-run effect can never send one twice. */
  const sentFollowUps = useRef(new Set<string>());

  // "No reply for x days → follow up": runs whenever the clock or a thread changes.
  useEffect(() => {
    if (clock === null) return;
    const { followUpDays, maxFollowUps } = state.outreachSettings;
    const due = Object.values(state.outreach).filter(
      (o) => o.stage === "awaiting_reply" && o.lastOutboundAt && clock - new Date(o.lastOutboundAt).getTime() >= followUpDays * DAY,
    );
    if (!due.length) return;
    const next = { ...state.outreach };
    const toSend: { appId: string; m: Message; to: string }[] = [];
    for (const o of due) {
      const app = apps.find((a) => a.id === o.appId);
      if (!app) continue;
      if (o.followUps >= maxFollowUps) {
        next[o.appId] = { ...o, stage: "closed_no_response", agentNote: `No reply after ${maxFollowUps} follow-ups. Closed; offered slots released.` };
      } else {
        const n = o.followUps + 1;
        const m: Message = { id: `fu-${o.appId}-${n}`, dir: "out", at: new Date(clock).toISOString(), by: "Agent", ...followUpMessage(app, o, n), delivery: "sending", note: `Auto follow-up ${n}/${maxFollowUps} after ${followUpDays} days of silence` };
        next[o.appId] = { ...o, followUps: n, lastOutboundAt: m.at, messages: [...o.messages, m], agentNote: `No reply for ${followUpDays} days — sent follow-up ${n}.` };
        toSend.push({ appId: o.appId, m, to: founderEmail(app) });
      }
    }
     
    setState((s) => ({ ...s, outreach: { ...s.outreach, ...Object.fromEntries(due.map((o) => [o.appId, next[o.appId]])) } }));
    for (const x of toSend) {
      const key = `${x.appId}:${next[x.appId].followUps}`;
      if (sentFollowUps.current.has(key)) continue;
      sentFollowUps.current.add(key);
      void dispatch(x.appId, x.m, x.to);
    }
     
  }, [clock, state.outreach, state.outreachSettings, apps]);

  const patchOutreach = (appId: string, f: (o: Outreach) => Outreach) =>
    setState((s) => (s.outreach[appId] ? { ...s, outreach: { ...s.outreach, [appId]: f(s.outreach[appId]) } } : s));

  const startOutreach = (appId: string, kind: OutreachKind) => {
    const app = apps.find((a) => a.id === appId);
    if (!app) return;
    let offered: Slot[] = [];
    if (kind === "invite") {
      const free = freeSlots(appId);
      const first = holds[appId] ?? free[0];
      // offer three options on different days where possible
      offered = first ? [first] : [];
      for (const sl of free) {
        if (offered.length >= 3) break;
        if (offered.some((o) => o.start === sl.start)) continue;
        if (offered.some((o) => o.start.slice(0, 10) === sl.start.slice(0, 10)) && free.some((x) => !offered.some((o) => o.start.slice(0, 10) === x.start.slice(0, 10)))) continue;
        offered.push(sl);
      }
      offered.sort((a, b) => a.start.localeCompare(b.start));
    }
    const draft = kind === "invite" ? inviteDraft(app, offered) : passDraft(app);
    setState((s) => ({ ...s, outreach: { ...s.outreach, [appId]: { appId, kind, stage: "draft", draft, offered, messages: [], followUps: 0, lastOutboundAt: null } } }));
  };

  const founderReply = async (appId: string, text: string): Promise<AgentDecision | null> => {
    const o = state.outreach[appId];
    const app = apps.find((a) => a.id === appId);
    if (!o || !app) return null;
    const inbound: Message = { id: msgId(), dir: "in", at: stamp(), by: "Founder", subject: `Re: ${o.messages[0]?.subject ?? app.name}`, body: text };
    patchOutreach(appId, (x) => ({ ...x, messages: [...x.messages, inbound], agentNote: "Agent is reading the reply…" }));
    let decision: AgentDecision;
    try {
      const res = await fetch("/api/booking-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          company: app.name,
          founder: app.founders[0]?.name ?? "Founder",
          offered: o.offered,
          free: freeSlots(appId).filter((sl) => !o.offered.some((x) => x.start === sl.start)),
          thread: o.messages.map((m) => ({ by: m.by, body: m.body })),
          reply: text,
          today: stamp(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      decision = json.decision;
    } catch (e) {
      patchOutreach(appId, (x) => ({ ...x, stage: "needs_human", agentNote: `Agent unavailable (${e instanceof Error ? e.message : e}). A partner should reply.` }));
      return null;
    }
    const pool = [...o.offered, ...freeSlots(appId)];
    const slot = decision.chosenSlot ? pool.find((sl) => sl.start === decision.chosenSlot) : undefined;
    if (!decision.needsHuman && slot && (decision.intent === "accept" || decision.intent === "propose_alternative")) {
      const conf = out("Agent", confirmationMessage(app, slot), "Auto-confirmed: founder picked a free slot · .ics attached");
      void dispatch(appId, conf, founderEmail(app), { filename: `${app.id}-call.ics`, content: buildICS(app, slot) });
      setState((s) => ({
        ...s,
        bookings: { ...s.bookings, [appId]: { slot: slot.start, label: slot.label, status: "confirmed" } },
        outreach: { ...s.outreach, [appId]: { ...s.outreach[appId], stage: "booked", booked: slot, messages: [...s.outreach[appId].messages, conf], agentNote: `${decision.summary} Booked ${slot.label}. (${decision.engine})`, pendingReply: undefined } },
      }));
    } else if (decision.intent === "decline" && !decision.needsHuman) {
      const ack = out("Agent", declineAckMessage(app), "Auto-acknowledged decline");
      void dispatch(appId, ack, founderEmail(app));
      patchOutreach(appId, (x) => ({ ...x, stage: "declined", messages: [...x.messages, ack], agentNote: `${decision.summary} (${decision.engine})`, pendingReply: undefined }));
    } else {
      const fallback: Draft = { to: o.draft?.to ?? "", subject: `Re: All In Capital × ${app.name}`, body: decision.reply?.body ?? "" };
      patchOutreach(appId, (x) => ({
        ...x,
        stage: "needs_human",
        pendingReply: { ...fallback, subject: decision.reply?.subject ?? fallback.subject },
        agentNote: `${decision.summary} Needs a partner: ${decision.reason} (${decision.engine})`,
      }));
    }
    return decision;
  };

  const value: Ctx = {
    ...state,
    ready,
    apps,
    holds,
    now,
    clock,
    freeSlots,
    scoreOf,
    startOutreach,
    founderReply,
    cancelOutreach: (appId) =>
      setState((s) => {
        const next = { ...s.outreach };
        delete next[appId];
        return { ...s, outreach: next };
      }),
    updateDraft: (appId, d) => patchOutreach(appId, (x) => ({ ...x, draft: d })),
    approveAndSend: (appId, by) => {
      const cur = state.outreach[appId];
      if (!cur?.draft) return;
      const m = out(by, { subject: cur.draft.subject, body: cur.draft.body }, `Approved and sent by ${by}`);
      void dispatch(appId, m, cur.draft.to);
      patchOutreach(appId, (x) => {
        if (!x.draft) return x;
        return {
          ...x,
          messages: [...x.messages, m],
          draft: null,
          stage: x.kind === "invite" ? "awaiting_reply" : "pass_sent",
          lastOutboundAt: m.at,
          agentNote: x.kind === "invite" ? `Watching for a reply. Follows up after ${state.outreachSettings.followUpDays} days of silence.` : undefined,
        };
      });
    },
    sendPendingReply: (appId, by, d) => {
      const app = apps.find((a) => a.id === appId);
      const m = out(by, { subject: d.subject, body: d.body }, `Reviewed and sent by ${by}`);
      void dispatch(appId, m, d.to || (app ? founderEmail(app) : ""));
      patchOutreach(appId, (x) => ({ ...x, messages: [...x.messages, m], pendingReply: undefined, stage: "awaiting_reply", lastOutboundAt: m.at, agentNote: "Watching for a reply." }));
    },
    rubric,
    allRubricVersions,
    saveRubric: (r, note, author) =>
      setState((s) => {
        const id = `v${s.rubricVersions.length + 1}`;
        const v: RubricVersion = { id, name: `${id} · ${author}`, note, author, at: new Date().toISOString(), rubric: r };
        return { ...s, rubricVersions: [...s.rubricVersions, v], activeRubricId: id };
      }),
    activateRubric: (id) => setState((s) => ({ ...s, activeRubricId: id })),
    advanceClock: (days) => setState((s) => ({ ...s, clockOffsetDays: s.clockOffsetDays + days })),
    setLens: (lens) => {
      if (lens === state.lens) return;
      beforeLens.forEach((fn) => fn());
      setState((s) => ({ ...s, lens }));
    },
    addCorrection: (c) =>
      setState((s) => ({
        ...s,
        corrections: [...s.corrections, { ...c, id: `c${Date.now().toString(36)}`, createdAt: new Date().toISOString() }],
      })),
    removeCorrection: (id) => setState((s) => ({ ...s, corrections: s.corrections.filter((c) => c.id !== id) })),
    setDecision: (appId, d) => setState((s) => ({ ...s, decisions: { ...s.decisions, [appId]: d } })),
    toggleDismiss: (appId, cid) =>
      setState((s) => {
        const cur = s.dismissed[appId] ?? [];
        return { ...s, dismissed: { ...s.dismissed, [appId]: cur.includes(cid) ? cur.filter((x) => x !== cid) : [...cur, cid] } };
      }),
    book: (appId, b) => setState((s) => ({ ...s, bookings: { ...s.bookings, [appId]: b } })),
    unbook: (appId) =>
      setState((s) => {
        const next = { ...s.bookings };
        delete next[appId];
        return { ...s, bookings: next };
      }),
    addApplication: (a) => setState((s) => ({ ...s, extra: [...s.extra.filter((x) => x.id !== a.id), a] })),
    reset: () => setState(DEFAULT),
  };

  /**
   * What the server rendered: default state, no clock, no holds. A component that hydrates
   * after saved state has loaded (e.g. inside a Suspense boundary) renders this first, so its
   * hydration render matches the server HTML, then switches to the live value.
   */
  const initial = useMemo<Ctx>(
    () => ({
      ...value,
      ...DEFAULT,
      ready: false,
      apps: APPLICATIONS,
      holds: {},
      now: null,
      clock: null,
      rubric: BASELINE_VERSION.rubric,
      allRubricVersions: [BASELINE_VERSION],
      freeSlots: () => [],
      scoreOf: (a: Application, lens?: Lens) => scoreApplication(a, lens ?? DEFAULT.lens, [], []),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- actions are stable enough; only defaults matter here
    [],
  );

  return <StoreCtx.Provider value={{ live: value, initial }}>{children}</StoreCtx.Provider>;
}

const noopSubscribe = () => () => {};

export function useStore(): Ctx {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  // false during server render and hydration, true afterwards
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return hydrated ? c.live : c.initial;
}
