# Triage Desk — All In Capital

A first-pass triage system for All In Capital's inbound applications. It reads the whole pile, scores each company against the fund's thesis criterion by criterion with a source behind every claim, names what it couldn't find, pre-holds calls for promising companies, remembers partner corrections, and is backtested against the fund's 12 real decisions.

It **recommends; partners decide.** Nothing is auto-rejected or auto-advanced.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Live intake (`/intake`) needs one model key in `.env.local`. Google Gemini's free tier needs no card:

```
GOOGLE_GENERATIVE_AI_API_KEY=...   # free at https://aistudio.google.com/apikey — used first if set
# or
AI_GATEWAY_API_KEY=...             # Vercel AI Gateway (Claude); requires a card on the Vercel account
# optional: TRIAGE_MODEL=gemini-3.8-flash   (or anthropic/claude-sonnet-5.5 for the gateway)

RESEND_API_KEY=...                 # free at https://resend.com/api-keys — real email sending
EMAIL_TEST_RECIPIENT=you@...       # every email is redirected here (test mode), marked with the intended founder
# after verifying a domain in Resend:
# EMAIL_FROM="All In Capital <triage@yourdomain.com>"
# EMAIL_LIVE_RECIPIENTS=true
```

Everything else works without a key.

## Pages

| Route | What it answers |
| --- | --- |
| `/pipeline` | The whiteboard flow running: every stage (system / partner / agent), where each application sits, and the partner inbox of things waiting on a human. |
| `/rubric` | Rubric editor (whiteboard box 1): criterion weights per lens, call/review thresholds, missing-data score. Live preview of backtest agreement, trust-contract checks and which applications change lane; saved as versions with a reason; any version can be re-activated. |
| `/` Desk | Where each of the 10 applications lands, the batch digest, time freed. Lens toggle re-sorts the board (GSAP Flip). |
| `/applications/[id]` | Seven-criterion scorecard, every claim with its source and verification status, red flags, gaps and what they cost, closest past decisions, Kushal's decision panel (call slot, .ics, founder email, pass note), score corrections. |
| `/backtest` | Agreement with the 12 memos under three tests (pre-call, in-sample, stated thesis), who was wrong on each disagreement, the trust contract, and where it breaks. |
| `/thesis` | Stated thesis (public sources) vs revealed thesis (memos), criteria definitions and weights, inferred anti-thesis, partner rules, portfolio used for conflict checks. |
| `/memory` | Correction ledger and where each correction now applies. |
| `/intake` | Paste a new deck + form; the model returns the same structure and the same engine scores it. |

## Ask the Desk (in-platform assistant)

Floating on every page. Answers questions about the batch, scores, evidence, past decisions, thesis, rubric, pipeline and how to use the platform, using Gemini (`/api/chat`, streaming).

Guardrails:
1. **Grounded only**: answers come from the desk's data (curated batch, memos, thesis, rubric) plus a size-capped snapshot of the live desk; cites sources like `[Deck · slide 7]`; says "That isn't in the desk's data" instead of guessing.
2. **No decisions**: never says the fund will/should invest — "the desk recommends; partners decide".
3. **Read-only**: can't send, book or change scores; explains where in the UI to do it.
4. **Scope**: politely declines off-topic requests (coding, general knowledge, other companies).
5. **Prompt-injection resistant**: desk state and founder text are wrapped as data; instructions inside decks/forms are ignored (tested).
6. **Secret/config probes** (keys, system prompt, "ignore previous instructions") get a fixed refusal without calling the model.
7. **No profiling**: won't speculate on founders' personal characteristics.
8. **Abuse limits**: per-IP rate limits + daily caps on chat, intake, agent, email and digest routes (`src/lib/ratelimit.ts`); input/output size caps.

## Batch intake & digest

- `/intake`: drop every deck and form PDF at once. Text is extracted server-side (`/api/extract`, `unpdf`), files are paired by company name, and each pair is researched (Google Search) and scored, two at a time.
- `/pipeline` → "Email this week's digest": every lane, what is waiting on a partner, and call status, sent only to `DIGEST_RECIPIENT` (or `EMAIL_TEST_RECIPIENT`).

## Workflow (the whiteboard)

```
Define rubric → Collect info (deck · form · Google Search) → Score → Recommend → 👤 Final decision
   ↑ corrections loop ───────────────────────────────────────────────┘        │
                                                         Go ──▶ Draft invite ─▶ 👤 Approve ─▶ Send ─▶ Booking agent
                                                         No ──▶ Draft pass   ─▶ 👤 Approve ─▶ Send        │
                                       Yes ▶ booked + confirmation + .ics · No ▶ acknowledged · Question ▶ 👤
                                       No reply for N days ▶ auto follow-up (×2) ▶ closed, slots released
```

- **Collect info**: with a Gemini key, `/api/analyze` first runs a Google-Search-grounded research pass (founders' footprint, competitors, regulation, portfolio overlap). Only URLs that search actually returned may be cited.
- **Outreach** (`src/lib/outreach.ts`, store): drafts are editable; nothing is sent until a partner approves. Sending goes through Resend (`/api/send-email`) in **test mode**: redirected to `EMAIL_TEST_RECIPIENT`. With no key it falls back to a simulated outbox.
- **Booking agent** (`/api/booking-agent`): reads a founder reply, books only slots that are actually free, auto-confirms accepts, acknowledges declines, and sends questions about money/terms to a partner with a drafted reply. Falls back to keyword rules with no model key.
- **Demo clock**: “+1 / +3 days” buttons advance time to exercise the no-reply follow-up path.

## How scoring works (`src/lib/engine.ts`)

- **Seven criteria**, each 0–10: founder–market fit, owns the hard risk, evidence & metric fluency, path to market, fits a pre-seed cheque, why now & right to win, thesis fit.
- **Two lenses**: *stated* (public wording) and *revealed* (what the memos turned on). The desk shows both and says which one drove the recommendation.
- **Composite** = Σ score × weight. No hidden penalties: contradictions lower the relevant criterion with a cited reason.
- **Missing data drags**: a criterion with no evidence is imputed at 3/10 (Meeting 1).
- **Gates**: portfolio conflict → hold; above-mandate stage → out of mandate; anti-thesis category → lean pass; soft gates (sector outside) cap at partner review.
- **Floor rule**: founder–market fit or risk ownership ≤ 2 can't be averaged into a call.
- **Confidence** reflects how much of the evidence is consistent/external vs self-reported, contradicted or unverifiable.
- **Corrections**: a partner sets a new score, gives a one-line reason, and picks the tags it generalises to. Matching companies get the scaled adjustment, shown with author and reason, and dismissible per company.

## Data (`src/lib/`)

- `applications.ts` — the 10 analysed applications (deck + form cross-checked, arithmetic recomputed, public context added).
- `memos.ts` — the 12 memos re-scored on the same criteria for the backtest.
- `thesis.ts` — criteria, weights, public sources, portfolio, partner rules.

## Known limits

See `/backtest` → "Exactly where it breaks". In short: memo-based backtest is in-sample; n = 12; founder behaviour in the room isn't visible from a deck; applicant founder links are placeholders so backgrounds are unverifiable; the portfolio list is public and incomplete; state is per-browser (localStorage); live intake has no web search yet.
