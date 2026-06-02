import { db } from "./firebase";
import { doc, getDoc, updateDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { groq, ANALYSIS_MODEL } from "./groq";

// Cost configuration for different providers/models
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-oss-120b": { input: 0.59 / 1000000, output: 0.79 / 1000000 },
  "gpt-4o": { input: 2.50 / 1000000, output: 10.00 / 1000000 },
  "gpt-4o-mini": { input: 0.15 / 1000000, output: 0.60 / 1000000 },
  "claude-3-5-sonnet": { input: 3.00 / 1000000, output: 15.00 / 1000000 },
  "gemini-1.5-flash": { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  "gemini-1.5-pro": { input: 1.25 / 1000000, output: 5.00 / 1000000 },
  "deepseek-r1": { input: 0.55 / 1000000, output: 2.19 / 1000000 },
};

export interface GatewayOptions {
  userId?: string;
  correlationId?: string;
  temperature?: number;
  zodSchema?: any; // optional schema validation
}

// Direct fetch callers to avoid heavy SDK dependencies in edge runtimes
async function callFreeModel(model: string, prompt: string, temperature: number) {
  const apiKey = process.env.FREEMODEL_API_KEY;
  if (!apiKey) throw new Error("FREEMODEL_API_KEY is not configured.");

  // Map requested model names to FreeModel's supported strings (FRE-5.5 for flagship / FRE-5.4 for standard/faster model)
  let targetModel = "FRE-5.5";
  if (model === "gpt-4o-mini" || model === "gemini-1.5-flash" || model === "openai/gpt-oss-120b") {
    targetModel = "FRE-5.4";
  } else if (model === "claude-3-5-sonnet" || model === "gpt-4o" || model === "gemini-1.5-pro") {
    targetModel = "FRE-5.5";
  } else if (model === "FRE-5.4" || model === "FRE-5.5") {
    targetModel = model;
  }

  const res = await fetch("https://api.freemodel.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: targetModel,
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(`FreeModel Error: ${errorJson?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return {
    content: data.choices[0]?.message?.content || "",
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
    }
  };
}

async function callOpenAI(model: string, prompt: string, temperature: number) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");
  
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature,
    }),
  });
  
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(`OpenAI Error: ${errorJson?.error?.message || res.statusText}`);
  }
  
  const data = await res.json();
  return {
    content: data.choices[0]?.message?.content || "",
    usage: {
      prompt_tokens: data.usage?.prompt_tokens || 0,
      completion_tokens: data.usage?.completion_tokens || 0,
    }
  };
}

async function callAnthropic(model: string, prompt: string, temperature: number) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: model || "claude-3-5-sonnet-20241022",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4000,
      temperature,
    }),
  });
  
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(`Anthropic Error: ${errorJson?.error?.message || res.statusText}`);
  }
  
  const data = await res.json();
  return {
    content: data.content[0]?.text || "",
    usage: {
      prompt_tokens: data.usage?.input_tokens || 0,
      completion_tokens: data.usage?.output_tokens || 0,
    }
  };
}

async function callGemini(model: string, prompt: string, temperature: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
  
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-1.5-flash"}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
      }
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini Error: ${errorText || res.statusText}`);
  }
  
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return {
    content: text,
    usage: {
      prompt_tokens: Math.round(prompt.length / 4), 
      completion_tokens: Math.round(text.length / 4),
    }
  };
}

export async function generateAICall(
  task: string,
  prompt: string,
  options: GatewayOptions = {}
): Promise<{ text: string; parsed?: any; traceId: string }> {
  const traceId = `trace-${Math.random().toString(36).substring(2, 15)}`;
  const correlationId = options.correlationId || `corr-${Math.random().toString(36).substring(2, 15)}`;
  const startTime = Date.now();

  // 1. Resolve preferred model & provider dynamically
  let preferredProvider = "Groq";
  let preferredModel = ANALYSIS_MODEL;
  let temperature = options.temperature !== undefined ? options.temperature : 0.7;

  try {
    const routeRef = doc(db, "settings", "routing");
    const routeSnap = await getDoc(routeRef);
    if (routeSnap.exists()) {
      const routing = routeSnap.data();
      if (routing[task]) {
        preferredModel = routing[task].model || preferredModel;
        preferredProvider = routing[task].provider || preferredProvider;
        temperature = routing[task].temperature !== undefined ? routing[task].temperature : temperature;
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve routing settings, using defaults:", err);
  }

  let attempt = 0;
  const maxAttempts = 3;
  let lastError: any = null;
  let rawResponse = "";

  while (attempt < maxAttempts) {
    attempt++;
    const attemptStartTime = Date.now();
    
    // Determine target provider & model for this specific attempt
    let currentProvider = preferredProvider;
    let currentModel = preferredModel;

    if (attempt === 2) {
      // Fallback 1: OpenAI
      if (process.env.OPENAI_API_KEY || process.env.FREEMODEL_API_KEY) {
        currentProvider = "OpenAI";
        currentModel = "gpt-4o-mini";
      } else {
        currentProvider = "Groq";
        currentModel = "openai/gpt-oss-120b";
      }
    } else if (attempt === 3) {
      // Fallback 2: Anthropic or Gemini
      if (process.env.ANTHROPIC_API_KEY || process.env.FREEMODEL_API_KEY) {
        currentProvider = "Anthropic";
        currentModel = "claude-3-5-sonnet";
      } else if (process.env.GEMINI_API_KEY) {
        currentProvider = "Gemini";
        currentModel = "gemini-1.5-flash";
      } else {
        currentProvider = "Groq";
        currentModel = "openai/gpt-oss-120b";
      }
    }

    try {
      let content = "";
      let usage = { prompt_tokens: 0, completion_tokens: 0 };

      // Route execution natively based on chosen provider
      if (process.env.FREEMODEL_API_KEY) {
        const result = await callFreeModel(currentModel, prompt, temperature);
        content = result.content;
        usage = result.usage;
      } else if (currentProvider === "OpenAI" && process.env.OPENAI_API_KEY) {
        const result = await callOpenAI(currentModel, prompt, temperature);
        content = result.content;
        usage = result.usage;
      } else if (currentProvider === "Anthropic" && process.env.ANTHROPIC_API_KEY) {
        const result = await callAnthropic(currentModel, prompt, temperature);
        content = result.content;
        usage = result.usage;
      } else if (currentProvider === "Gemini" && process.env.GEMINI_API_KEY) {
        const result = await callGemini(currentModel, prompt, temperature);
        content = result.content;
        usage = result.usage;
      } else {
        // Default to Groq SDK
        const completion = await groq.chat.completions.create({
          model: currentModel,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_completion_tokens: 4096,
        });
        content = completion.choices[0]?.message?.content || "";
        usage = {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
        };
      }

      rawResponse = content;
      const latency = Date.now() - attemptStartTime;

      // Zod/Schema Validation check
      let parsedJson: any = null;
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsedJson = JSON.parse(jsonMatch[0]);
          if (options.zodSchema) {
            options.zodSchema.parse(parsedJson); 
          }
        } catch (e) {
          throw new Error("JSON response failed schema validation check.");
        }
      } else {
        throw new Error("AI returned malformed or non-JSON output.");
      }

      // Cost calculations
      const pricing = TOKEN_PRICING[currentModel] || { input: 0.5 / 1000000, output: 0.8 / 1000000 };
      const calculatedCost = (usage.prompt_tokens * pricing.input) + (usage.completion_tokens * pricing.output);

      // Log success transaction
      await logAICallToDB({
        traceId,
        correlationId,
        userId: options.userId || "anonymous",
        task,
        provider: currentProvider,
        model: currentModel,
        tokensInput: usage.prompt_tokens,
        tokensOutput: usage.completion_tokens,
        cost: parseFloat(calculatedCost.toFixed(6)),
        latency: Date.now() - startTime,
        status: "success",
        prompt,
        response: rawResponse,
      });

      await updateProviderHealth(currentProvider, true, latency);

      return { text: rawResponse, parsed: parsedJson, traceId };

    } catch (err: any) {
      lastError = err;
      const latency = Date.now() - attemptStartTime;
      await updateProviderHealth(currentProvider, false, latency);

      console.warn(`Gateway Attempt ${attempt} via ${currentProvider} failed: ${err.message}`);
    }
  }

  // If we reach here, all retries/fallbacks failed
  const errorLatency = Date.now() - startTime;
  await logAICallToDB({
    traceId,
    correlationId,
    userId: options.userId || "anonymous",
    task,
    provider: preferredProvider,
    model: preferredModel,
    tokensInput: 0,
    tokensOutput: 0,
    cost: 0,
    latency: errorLatency,
    status: "error",
    prompt,
    response: "",
    error: lastError?.message || "Execution collapsed",
  });

  throw lastError || new Error("AI gateway call failed on all providers.");
}

async function logAICallToDB(log: any) {
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
