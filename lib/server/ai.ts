import type { AiProviderName } from "@/lib/api-types";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-5.5";
const DEFAULT_TIMEOUT_MS = 20_000;

type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

type GenerateJsonInput = {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: JsonSchema;
  temperature?: number;
};

type ProviderResult = {
  provider: AiProviderName;
  model: string;
  json: unknown;
};

type FetchLike = typeof fetch;

export class AiConfigurationError extends Error {}
export class AiProviderError extends Error {}

function envInt(name: string, fallback: number) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function timeoutMs() {
  return envInt("AI_REQUEST_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
}

function configuredProviders() {
  const providers: Array<{
    name: AiProviderName;
    apiKey: string;
    model: string;
  }> = [];

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  if (geminiKey) {
    providers.push({
      name: "gemini",
      apiKey: geminiKey,
      model: process.env.AI_GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL,
    });
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    providers.push({
      name: "openai",
      apiKey: openAiKey,
      model: process.env.AI_OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL,
    });
  }

  return providers;
}

async function fetchWithTimeout(
  fetchImpl: FetchLike,
  url: string,
  init: RequestInit,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs());
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseProviderError(provider: AiProviderName, status: number, body: unknown) {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: { message?: string } }).error;
    if (error?.message) return `${provider} returned ${status}: ${error.message}`;
  }
  return `${provider} returned ${status}`;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function parseJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    // Models occasionally append a second object or a short note after valid JSON.
    // Parse the first complete object and let Zod enforce the actual schema later.
  }

  const first = candidate.indexOf("{");
  if (first < 0) {
    throw new AiProviderError("AI response did not contain a JSON object.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = first; index < candidate.length; index += 1) {
    const char = candidate[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(candidate.slice(first, index + 1)) as unknown;
      }
    }
  }

  throw new AiProviderError("AI response did not contain a complete JSON object.");
}

function geminiText(body: unknown) {
  const candidates = (body as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
    .candidates;
  return candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim() ?? "";
}

async function callGemini(
  input: GenerateJsonInput,
  provider: { apiKey: string; model: string },
  fetchImpl: FetchLike,
): Promise<ProviderResult> {
  const response = await fetchWithTimeout(
    fetchImpl,
    `${GEMINI_API_URL}/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(provider.apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: input.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: input.userPrompt }] }],
        generationConfig: {
          temperature: input.temperature ?? 0.3,
          responseMimeType: "application/json",
          responseJsonSchema: input.jsonSchema.schema,
        },
      }),
    },
  );
  const body = await readJson(response);
  if (!response.ok) throw new AiProviderError(parseProviderError("gemini", response.status, body));
  const text = geminiText(body);
  if (!text) throw new AiProviderError("Gemini returned an empty response.");
  return { provider: "gemini", model: provider.model, json: parseJsonObject(text) };
}

function openAiText(body: unknown) {
  const response = body as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };
  if (response.output_text) return response.output_text;
  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

async function callOpenAi(
  input: GenerateJsonInput,
  provider: { apiKey: string; model: string },
  fetchImpl: FetchLike,
): Promise<ProviderResult> {
  const response = await fetchWithTimeout(fetchImpl, OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      input: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: input.userPrompt },
      ],
      max_output_tokens: 3000,
      text: {
        format: {
          type: "json_schema",
          name: input.jsonSchema.name,
          schema: input.jsonSchema.schema,
          strict: true,
        },
      },
    }),
  });
  const body = await readJson(response);
  if (!response.ok) throw new AiProviderError(parseProviderError("openai", response.status, body));
  const text = openAiText(body);
  if (!text) throw new AiProviderError("OpenAI returned an empty response.");
  return { provider: "openai", model: provider.model, json: parseJsonObject(text) };
}

export async function generateJsonWithAi(
  input: GenerateJsonInput,
  options: { fetchImpl?: FetchLike } = {},
): Promise<ProviderResult> {
  const providers = configuredProviders();
  if (!providers.length) {
    throw new AiConfigurationError("Configure GEMINI_API_KEY or OPENAI_API_KEY to enable AI features.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const errors: string[] = [];
  for (const provider of providers) {
    try {
      if (provider.name === "gemini") return await callGemini(input, provider, fetchImpl);
      return await callOpenAi(input, provider, fetchImpl);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throw new AiProviderError(errors.join(" | ") || "All AI providers failed.");
}
