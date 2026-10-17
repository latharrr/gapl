import Groq from "groq-sdk";

export const ANALYSIS_MODEL = "openai/gpt-oss-120b";

let cachedClient: Groq | null = null;

/**
 * Returns a lazily-created Groq client.
 *
 * The client is intentionally NOT instantiated at module scope: importing
 * this module must never throw when GROQ_API_KEY is unset (e.g. during
 * `next build` page-data collection, where every route module is evaluated).
 * The key is only required — and only read — when an AI call is actually made.
 */
export function getGroq(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set. AI analysis will not work.");
  }
  if (!cachedClient) {
    cachedClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return cachedClient;
}
