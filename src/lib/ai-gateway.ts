import Anthropic from "@anthropic-ai/sdk";
import { db, doc, getDoc, updateDoc, setDoc, collection, addDoc } from "./server-firestore";
import { getGroq, ANALYSIS_MODEL } from "./groq";

// The model every user-facing task runs on, and the one tried when it fails.
export const PRIMARY_MODEL = "claude-opus-5-5";
export const BACKUP_MODEL = "claude-sonnet-5-5";

// USD per token. Claude rates from Anthropic's price list (2026-10).
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4.00 / 1000000, output: 20.00 / 1000000 },
  "claude-sonnet-5-5": { input: 2.00 / 1000000, output: 10.00 / 1000000 },
  "claude-opus-5": { input: 5.00 / 1000000, output: 25.00 / 1000000 },
  "claude-opus-4-8": { input: 5.00 / 1000000, output: 25.00 / 1000000 },
  "claude-sonnet-5": { input: 2.00 / 1000000, output: 10.00 / 1000000 },
  "openai/gpt-oss-120b": { input: 0.59 / 1000000, output: 0.79 / 1000000 },
  "gpt-4o-mini": { input: 0.15 / 1000000, output: 0.60 / 1000000 },
};

export interface GatewayOptions {
  userId?: string;
  correlationId?: string;
  zodSchema?: { parse: (data: unknown) => unknown }; // optional schema validation
  isJson?: boolean; // set false for raw plain text responses
}

interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

interface ProviderResult {
  content: string;
  usage: Usage;
  /** The model that actually answered (differs from the requested one after a server-side fallback). */
  model: string;
}

let anthropicClient: Anthropic | null = null;

// Created on first use so importing this module never needs the key (e.g. during `next build`).
function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured.");
  // The gateway runs its own model fallback chain, so one SDK retry is enough.
  anthropicClient ??= new Anthropic({ maxRetries: 1, timeout: 150_000 });
  return anthropicClient;
}

async function callAnthropic(model: string, prompt: string): Promise<ProviderResult> {
  const response = await getAnthropic().beta.messages.create({
    model,
    max_tokens: 16000,
    // Opus 5.5 always thinks; effort sets how much. Medium is the model's default and keeps a report near ₹9.
    output_config: { effort: "medium" },
    // A safety-classifier decline is retried server-side on Anthropic's recommended model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`Claude declined the request (${response.stop_details?.category ?? "no category"}).`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Claude hit the output limit before finishing.");
  }

  const content = response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return {
    content,
    model: response.model,
    usage: {
      prompt_tokens:
        response.usage.input_tokens +
        (response.usage.cache_creation_input_tokens ?? 0) +
        (response.usage.cache_read_input_tokens ?? 0),
      completion_tokens: response.usage.output_tokens,
    },
  };
}

// Last-resort fallbacks, used only when both Claude models fail.
async function callFreeModel(prompt: string): Promise<ProviderResult> {
  const apiKey = process.env.FREEMODEL_API_KEY;
  if (!apiKey) throw new Error("FREEMODEL_API_KEY is not configured.");

  const targetModel = process.env.FREEMODEL_MODEL || "gpt-4o-mini";
  const apiUrl = process.env.FREEMODEL_API_URL || "https://api.freemodel.dev/v1/chat/completions";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(`FreeModel Error: ${errorJson?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0]?.message?.content || "",
    model: targetModel,
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
    },
  };
}

async function callGroq(prompt: string): Promise<ProviderResult> {
  const completion = await getGroq().chat.completions.create({
    model: ANALYSIS_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_completion_tokens: 8192,
  });
  return {
    content: completion.choices[0]?.message?.content || "",
    model: ANALYSIS_MODEL,
    usage: {
      prompt_tokens: completion.usage?.prompt_tokens || 0,
      completion_tokens: completion.usage?.completion_tokens || 0,
    },
  };
}

interface Attempt {
  provider: "Anthropic" | "FreeModel" | "Groq";
  model: string;
}

/**
 * Claude first, then whichever legacy provider still has a key.
 * An admin routing override is honoured only when it names a Claude model.
 */
function attemptChain(routedModel: string | undefined): Attempt[] {
  const chain: Attempt[] = [];
  if (process.env.ANTHROPIC_API_KEY) {
    const primary = routedModel?.startsWith("claude-") ? routedModel : PRIMARY_MODEL;
    chain.push({ provider: "Anthropic", model: primary });
    if (primary !== BACKUP_MODEL) chain.push({ provider: "Anthropic", model: BACKUP_MODEL });
  }
  if (process.env.FREEMODEL_API_KEY) chain.push({ provider: "FreeModel", model: process.env.FREEMODEL_MODEL || "gpt-4o-mini" });
  if (process.env.GROQ_API_KEY) chain.push({ provider: "Groq", model: ANALYSIS_MODEL });
  return chain;
}

function runAttempt(attempt: Attempt, prompt: string): Promise<ProviderResult> {
  if (attempt.provider === "Anthropic") return callAnthropic(attempt.model, prompt);
  if (attempt.provider === "FreeModel") return callFreeModel(prompt);
  return callGroq(prompt);
}

function costOf(model: string, provider: string, usage: Usage): number {
  let pricing = TOKEN_PRICING[model];
  if (provider === "FreeModel") {
    const envInput = process.env.FREEMODEL_TOKEN_PRICE_INPUT;
    const envOutput = process.env.FREEMODEL_TOKEN_PRICE_OUTPUT;
    const fallback = pricing || TOKEN_PRICING["gpt-4o-mini"];
    pricing = {
      input: envInput ? parseFloat(envInput) / 1000000 : fallback.input,
      output: envOutput ? parseFloat(envOutput) / 1000000 : fallback.output,
    };
  }
  pricing ??= { input: 0.5 / 1000000, output: 0.8 / 1000000 };
  return usage.prompt_tokens * pricing.input + usage.completion_tokens * pricing.output;
}

export async function generateAICall(
  task: string,
  prompt: string,
  options: GatewayOptions = {}
): Promise<{ text: string; parsed?: unknown; traceId: string }> {
  const traceId = `trace-${Math.random().toString(36).substring(2, 15)}`;
  const correlationId = options.correlationId || `corr-${Math.random().toString(36).substring(2, 15)}`;
  const startTime = Date.now();

  let routedModel: string | undefined;
  try {
    const routeSnap = await getDoc(doc(db, "settings", "routing"));
    if (routeSnap.exists()) routedModel = routeSnap.data()?.[task]?.model;
  } catch (err) {
    console.warn("Failed to retrieve routing settings, using defaults:", err);
  }

  const chain = attemptChain(routedModel);
  if (chain.length === 0) throw new Error("No AI provider is configured. Set ANTHROPIC_API_KEY.");

  let lastError: unknown = null;

  for (const attempt of chain) {
    const attemptStartTime = Date.now();
    try {
      const result = await runAttempt(attempt, prompt);
      const rawResponse = result.content;
      const latency = Date.now() - attemptStartTime;

      let parsedJson: unknown = null;
      if (options.isJson !== false) {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("AI returned malformed or non-JSON output.");
        try {
          parsedJson = JSON.parse(jsonMatch[0]);
          if (options.zodSchema) options.zodSchema.parse(parsedJson);
        } catch {
          throw new Error("JSON response failed schema validation check.");
        }
      }

      await logAICallToDB({
        traceId,
        correlationId,
        userId: options.userId || "anonymous",
        task,
        provider: attempt.provider,
        model: result.model,
        tokensInput: result.usage.prompt_tokens,
        tokensOutput: result.usage.completion_tokens,
        cost: parseFloat(costOf(result.model, attempt.provider, result.usage).toFixed(6)),
        latency: Date.now() - startTime,
        status: "success",
        ...buildContentLog(prompt, rawResponse),
      });

      await updateProviderHealth(attempt.provider, true, latency);

      return { text: rawResponse, parsed: parsedJson, traceId };
    } catch (err) {
      lastError = err;
      await updateProviderHealth(attempt.provider, false, Date.now() - attemptStartTime);
      console.warn(`Gateway attempt via ${attempt.provider} ${attempt.model} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  await logAICallToDB({
    traceId,
    correlationId,
    userId: options.userId || "anonymous",
    task,
    provider: chain[0].provider,
    model: chain[0].model,
    tokensInput: 0,
    tokensOutput: 0,
    cost: 0,
    latency: Date.now() - startTime,
    status: "error",
    ...buildContentLog(prompt, ""),
    error: lastError instanceof Error ? lastError.message : "Execution collapsed",
  });

  throw lastError || new Error("AI gateway call failed on all providers.");
}

function buildContentLog(prompt: string, response: string) {
  const metadata = { promptChars: prompt.length, responseChars: response.length };
  if (process.env.AI_LOG_CONTENT === "true") return { ...metadata, prompt, response };
  return { ...metadata, prompt: "[redacted]", response: "[redacted]" };
}

interface AICallLog {
  traceId: string;
  correlationId: string;
  userId: string;
  task: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  latency: number;
  status: "success" | "error";
  promptChars: number;
  responseChars: number;
  prompt: string;
  response: string;
  error?: string;
}

async function logAICallToDB(log: AICallLog) {
  try {
    const logsRef = collection(db, "ai_calls");
    await addDoc(logsRef, {
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("AI gateway failed to write transaction log:", err);
  }
}

async function updateProviderHealth(provider: string, success: boolean, latency: number) {
  try {
    const healthRef = doc(db, "provider_health", provider.toLowerCase());
    const healthSnap = await getDoc(healthRef);

    if (!healthSnap.exists()) {
      await setDoc(healthRef, {
        provider,
        requests: 1,
        successes: success ? 1 : 0,
        errors: success ? 0 : 1,
        totalLatency: latency,
        uptime: success ? 100 : 0,
        lastUpdated: new Date().toISOString(),
      });
    } else {
      const data = healthSnap.data();
      const newRequests = (data.requests || 0) + 1;
      const newSuccesses = (data.successes || 0) + (success ? 1 : 0);
      const newErrors = (data.errors || 0) + (success ? 0 : 1);
      const newTotalLatency = (data.totalLatency || 0) + latency;
      const calculatedUptime = (newSuccesses / newRequests) * 100;

      await updateDoc(healthRef, {
        requests: newRequests,
        successes: newSuccesses,
        errors: newErrors,
        totalLatency: newTotalLatency,
        uptime: parseFloat(calculatedUptime.toFixed(1)),
        lastUpdated: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("Failed to update provider health:", err);
  }
}
