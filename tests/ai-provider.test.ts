import { afterEach, describe, expect, it } from "vitest";
import {
  AiConfigurationError,
  generateJsonWithAi,
  parseJsonObject,
} from "@/lib/server/ai";

const originalGeminiKey = process.env.GEMINI_API_KEY;
const originalGeminiModel = process.env.AI_GEMINI_MODEL;
const originalOpenAiKey = process.env.OPENAI_API_KEY;
const originalOpenAiModel = process.env.AI_OPENAI_MODEL;

afterEach(() => {
  if (originalGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }
  if (originalGeminiModel === undefined) {
    delete process.env.AI_GEMINI_MODEL;
  } else {
    process.env.AI_GEMINI_MODEL = originalGeminiModel;
  }
  if (originalOpenAiKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAiKey;
  }
  if (originalOpenAiModel === undefined) {
    delete process.env.AI_OPENAI_MODEL;
  } else {
    process.env.AI_OPENAI_MODEL = originalOpenAiModel;
  }
});

const jsonSchema = {
  name: "test_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["ok"],
    properties: { ok: { type: "boolean" } },
  },
};

describe("AI provider helpers", () => {
  it("parses fenced JSON responses", () => {
    expect(parseJsonObject("```json\n{\"ok\":true}\n```")).toEqual({ ok: true });
  });

  it("parses the first complete JSON object when a provider appends extra output", () => {
    expect(parseJsonObject("{\"ok\":true}\n{\"ignored\":true}")).toEqual({ ok: true });
    expect(parseJsonObject("Result:\n{\"ok\":\"brace } inside string\"}\nDone")).toEqual({
      ok: "brace } inside string",
    });
  });

  it("fails clearly when no provider key is configured", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(
      generateJsonWithAi({ systemPrompt: "x", userPrompt: "y", jsonSchema }),
    ).rejects.toBeInstanceOf(AiConfigurationError);
  });

  it("passes the JSON schema to Gemini", async () => {
    process.env.GEMINI_API_KEY = "gemini-test";
    delete process.env.OPENAI_API_KEY;

    let requestBody: unknown;
    const fetchImpl = async (_url: string | URL | Request, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        candidates: [{ content: { parts: [{ text: "{\"ok\":true}" }] } }],
      });
    };

    const result = await generateJsonWithAi(
      { systemPrompt: "x", userPrompt: "y", jsonSchema },
      { fetchImpl: fetchImpl as typeof fetch },
    );

    const generationConfig = (requestBody as { generationConfig?: Record<string, unknown> })
      .generationConfig;
    expect(generationConfig?.responseMimeType).toBe("application/json");
    expect(generationConfig?.responseJsonSchema).toEqual(jsonSchema.schema);
    expect(result.json).toEqual({ ok: true });
  });

  it("falls back to OpenAI when Gemini fails", async () => {
    process.env.GEMINI_API_KEY = "gemini-test";
    process.env.OPENAI_API_KEY = "openai-test";
    process.env.AI_OPENAI_MODEL = "test-openai";

    const calls: string[] = [];
    const fetchImpl = async (url: string | URL | Request) => {
      const target = String(url);
      calls.push(target);
      if (target.includes("generativelanguage.googleapis.com")) {
        return Response.json({ error: { message: "quota" } }, { status: 429 });
      }
      return Response.json({
        output: [{ content: [{ text: "{\"ok\":true}" }] }],
      });
    };

    const result = await generateJsonWithAi(
      { systemPrompt: "x", userPrompt: "y", jsonSchema },
      { fetchImpl: fetchImpl as typeof fetch },
    );

    expect(calls).toHaveLength(2);
    expect(result.provider).toBe("openai");
    expect(result.model).toBe("test-openai");
    expect(result.json).toEqual({ ok: true });
  });
});
