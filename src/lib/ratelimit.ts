import "server-only";

/**
 * Best-effort abuse protection for a public deployment that spends free-tier quotas
 * (Gemini, Resend). Sliding window per client IP and route, plus a global daily cap per route.
 *
 * In-memory: Fluid Compute reuses instances, so this holds across most requests, but it is not a
 * hard guarantee across instances. A shared store (e.g. Upstash Redis free tier) would make it exact.
 */
type Bucket = number[];
const hits = new Map<string, Bucket>();
const daily = new Map<string, { day: string; n: number }>();

export const LIMITS = {
  chat: { perWindow: 30, windowMs: 10 * 60_000, perDay: 600 },
  analyze: { perWindow: 15, windowMs: 60 * 60_000, perDay: 120 },
  extract: { perWindow: 60, windowMs: 60 * 60_000, perDay: 600 },
  agent: { perWindow: 40, windowMs: 60 * 60_000, perDay: 400 },
  email: { perWindow: 25, windowMs: 60 * 60_000, perDay: 90 }, // Resend free tier: 100/day
  digest: { perWindow: 5, windowMs: 60 * 60_000, perDay: 20 },
} as const;

export type LimitName = keyof typeof LIMITS;

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim();
}

/** Returns null when allowed, or a 429 Response when the caller is over a limit. */
export function rateLimit(req: Request, name: LimitName): Response | null {
  const cfg = LIMITS[name];
  const now = Date.now();
  const key = `${name}:${clientIp(req)}`;
  const b = (hits.get(key) ?? []).filter((t) => now - t < cfg.windowMs);
  const today = new Date().toISOString().slice(0, 10);
  const d = daily.get(name);
  const dayCount = d && d.day === today ? d.n : 0;

  if (b.length >= cfg.perWindow) {
    const retry = Math.ceil((cfg.windowMs - (now - b[0])) / 1000);
    return Response.json({ error: `Too many requests — try again in ${Math.ceil(retry / 60)} min.` }, { status: 429, headers: { "Retry-After": String(retry) } });
  }
  if (dayCount >= cfg.perDay) {
    return Response.json({ error: "Daily limit for this feature reached on the demo deployment. Try again tomorrow." }, { status: 429 });
  }
  b.push(now);
  hits.set(key, b);
  daily.set(name, { day: today, n: dayCount + 1 });
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 3_600_000) hits.delete(k);
  return null;
}
