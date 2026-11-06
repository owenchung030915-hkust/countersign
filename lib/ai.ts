import { createOpenAI } from "@ai-sdk/openai";

export function aiConfig() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  const modelName = process.env.AI_MODEL || "gpt-4o-mini";
  const baseURL = process.env.AI_BASE_URL || undefined;
  return { enabled: Boolean(apiKey), apiKey, modelName, baseURL };
}

export function languageModel() {
  const config = aiConfig();
  if (!config.enabled) return null;
  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    compatibility: config.baseURL ? "compatible" : "strict",
  });
  return provider(config.modelName);
}

export async function within<T>(work: Promise<T>, ms = 20000): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("The model took too long.")), ms);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
