import { db, collection, addDoc } from "./server-firestore";

export interface AICallLog {
  timestamp: string;
  userId: string;
  userEmail?: string;
  provider: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  cost: number; // in USD
  latency: number; // in milliseconds
  status: "success" | "error";
  prompt: string;
  response: string;
  error?: string;
}

// Token pricing estimation: e.g. $0.59 per million input, $0.79 per million output
const INPUT_COST_PER_TOKEN = 0.59 / 1000000;
const OUTPUT_COST_PER_TOKEN = 0.79 / 1000000;

export async function logAICall(data: Omit<AICallLog, "timestamp" | "cost">) {
  try {
    const cost = (data.tokensInput * INPUT_COST_PER_TOKEN) + (data.tokensOutput * OUTPUT_COST_PER_TOKEN);
    const log: AICallLog = {
      ...data,
      timestamp: new Date().toISOString(),
      cost: parseFloat(cost.toFixed(6)),
    };

    const logsRef = collection(db, "ai_calls");
    await addDoc(logsRef, log);
  } catch (err) {
    console.error("Failed to log AI call to Firestore:", err);
  }
}
