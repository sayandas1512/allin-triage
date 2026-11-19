import "server-only";
import type { LanguageModel } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Provider choice (server only):
 *  1. GOOGLE_GENERATIVE_AI_API_KEY → Google Gemini directly (free tier). Also enables Google Search grounding.
 *  2. AI_GATEWAY_API_KEY / VERCEL_OIDC_TOKEN → Vercel AI Gateway (Claude by default).
 * TRIAGE_MODEL overrides the model id for whichever provider is used.
 */
export function pickModel(): { model: LanguageModel; label: string; google: ReturnType<typeof createGoogleGenerativeAI> | null } | null {
  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (googleKey) {
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const id = process.env.TRIAGE_MODEL ?? "gemini-3.8-flash";
    return { model: google(id), label: `google/${id}`, google };
  }
  if (process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN) {
    const id = process.env.TRIAGE_MODEL ?? "anthropic/claude-sonnet-5.5";
    return { model: id, label: id, google: null };
  }
  return null;
}
