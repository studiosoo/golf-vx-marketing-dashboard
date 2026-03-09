import { ENV } from "./env";
import type { InvokeParams, InvokeResult } from "./llm";

/**
 * Invoke Claude (Anthropic) via the native Messages API.
 * Normalizes the response to the same InvokeResult shape as invokeLLM,
 * so callers can swap between Gemini and Claude without branching on response shape.
 */
export async function invokeClaudeLLM(
  params: InvokeParams,
  model = "claude-sonnet-4-6"
): Promise<InvokeResult> {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  // Extract system prompt(s) — Anthropic uses a top-level system field
  const systemText = params.messages
    .filter(m => m.role === "system")
    .map(m => (typeof m.content === "string" ? m.content : JSON.stringify(m.content)))
    .join("\n");

  // Build conversation turns (exclude system messages)
  const turns = params.messages
    .filter(m => m.role !== "system")
    .map(m => ({
      role: m.role as "user" | "assistant",
      content: typeof m.content === "string" ? m.content : m.content,
    }));

  const body: Record<string, unknown> = {
    model,
    max_tokens: params.maxTokens ?? params.max_tokens ?? 8192,
    messages: turns,
  };

  if (systemText) {
    body.system = systemText;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Claude API error: ${response.status} ${response.statusText} – ${errorText}`
    );
  }

  const data = await response.json();

  // Concatenate all text blocks in the response
  const text = (data.content as Array<{ type: string; text?: string }>)
    ?.filter(c => c.type === "text")
    .map(c => c.text ?? "")
    .join("") ?? "";

  return {
    id: data.id ?? "claude-response",
    created: Math.floor(Date.now() / 1000),
    model: data.model ?? model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: text },
        finish_reason: data.stop_reason ?? null,
      },
    ],
    usage: data.usage
      ? {
          prompt_tokens: data.usage.input_tokens ?? 0,
          completion_tokens: data.usage.output_tokens ?? 0,
          total_tokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
        }
      : undefined,
  };
}
