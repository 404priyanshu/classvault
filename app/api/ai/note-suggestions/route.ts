import { NextResponse, type NextRequest } from "next/server";
import type { AiNoteSuggestion } from "@/lib/api-types";
import { AiConfigurationError, AiProviderError, generateJsonWithAi } from "@/lib/server/ai";
import { requireCurrentUser } from "@/lib/server/auth";
import { handleRouteError, jsonError } from "@/lib/server/http";
import { assertRateLimit, requestKey } from "@/lib/server/rate-limit";
import {
  aiNoteSuggestionRequestSchema,
  aiNoteSuggestionResponseSchema,
} from "@/lib/server/validation";

const suggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "tags"],
  properties: {
    description: { type: "string", minLength: 1, maxLength: 600 },
    tags: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string", minLength: 1, maxLength: 40 },
    },
  },
};

type SuggestionInput = ReturnType<typeof aiNoteSuggestionRequestSchema.parse>;

function buildPrompt(input: SuggestionInput) {
  return `Write a short description and topic tags for a study resource a student is uploading.

Title: ${input.title}
Subject: ${input.subject}
Course code: ${input.courseCode}
Unit: ${input.unit || "not specified"}
File name: ${input.fileName || "not provided"}

Rules:
- Description: 1-2 factual sentences, no marketing language, max ~400 characters.
- Tags: up to 6 short keywords (topic names, the course code, "PYQ" if relevant); no leading '#'.
- Base everything only on the metadata above; do not invent specifics you cannot infer.
- Return only JSON matching the schema.`;
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    await assertRateLimit({
      key: requestKey(request, "ai-note-suggestion", user.id),
      limit: 30,
      windowMs: 60 * 60 * 1000,
    });

    const input = aiNoteSuggestionRequestSchema.parse(await request.json());
    const result = await generateJsonWithAi({
      systemPrompt:
        "You are ClassVault's upload assistant. Produce a concise, factual description and relevant tags for a study resource from the metadata provided. Return only valid JSON.",
      userPrompt: buildPrompt(input),
      jsonSchema: { name: "classvault_note_suggestion", schema: suggestionJsonSchema },
      temperature: 0.3,
    });

    const parsed = aiNoteSuggestionResponseSchema.parse(result.json);
    const response: AiNoteSuggestion = {
      description: parsed.description,
      tags: Array.from(new Set(parsed.tags.map((tag) => tag.trim()).filter(Boolean))).slice(0, 6),
    };
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof AiConfigurationError) {
      return jsonError("AI_NOT_CONFIGURED", "AI suggestions are not configured yet.", 503);
    }
    if (error instanceof AiProviderError) {
      console.error(error.message);
      const detail = process.env.NODE_ENV !== "production" ? ` (${error.message})` : "";
      return jsonError("AI_PROVIDER_FAILED", `Could not generate suggestions. Try again.${detail}`, 502);
    }
    return handleRouteError(error);
  }
}
