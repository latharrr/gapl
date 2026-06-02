import Groq from "groq-sdk";

if (!process.env.GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not set. AI analysis will not work.");
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const ANALYSIS_MODEL = "openai/gpt-oss-120b";
