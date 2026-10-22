import type {
  ModelInterpretEvent,
  ModelInterpretOptions,
  ModelUsage,
} from "../../../model/index.ts"
import {
  AssistantSign,
  ReasoningSign,
  ToolCallSign,
  isAssistantSign,
  isPersonaSign,
  isProviderDataSign,
  isReasoningSign,
  isToolCallSign,
  isToolOutputSign,
  isToolSign,
  isUserSign,
  type Sign,
  type ToolSign,
} from "../../../sign/index.ts"
import {
  UsageSchema,
  type ChatCompletionInput,
  type Client,
  type Message,
  type Tool,
} from "../client/index.ts"
import type { ModelConfig } from "./ModelConfig.ts"

export async function* interpret(
  client: Client,
  config: ModelConfig,
  input: Array<Sign>,
  options: ModelInterpretOptions = {},
): AsyncGenerator<ModelInterpretEvent> {
  const request: ChatCompletionInput = {
    model: config.name,
    messages: Array.from(parseMessage(input)),
    tools: input.filter(isToolSign).map(makeTool),
    thinking: {
      type: config.thinking,
    },
    reasoning_effort:
      config.thinking === "enabled" ? config.reasoningEffort : "none",
  }

  let reasoning = ""
  let content = ""
  let activeKind: "ReasoningSign" | "AssistantSign" | undefined
  let usage: ModelUsage | undefined
  const toolCalls = new Map<number, ToolCallSign>()

  function* finishActiveKind(): Generator<ModelInterpretEvent> {
    if (activeKind === "ReasoningSign" && reasoning !== "") {
      yield { type: "sign", sign: ReasoningSign(reasoning) }
    }

    if (activeKind === "AssistantSign" && content !== "") {
      yield { type: "sign", sign: AssistantSign(content) }
    }

    activeKind = undefined
  }

  for await (const chunk of client.chat.completions.createStream(request, {
    signal: options.signal,
  })) {
    const nextUsage = makeModelUsage(chunk.usage)
    if (nextUsage !== undefined) usage = nextUsage

    const delta = chunk.choices?.[0]?.delta
    if (delta === undefined) continue

    if (
      typeof delta.reasoning_content === "string" &&
      delta.reasoning_content !== ""
    ) {
      if (activeKind !== "ReasoningSign") {
        yield* finishActiveKind()
        activeKind = "ReasoningSign"
      }

      reasoning += delta.reasoning_content
      yield {
        type: "delta",
        delta: {
          signKind: "ReasoningSign",
          content: delta.reasoning_content,
        },
      }
    }

    if (typeof delta.content === "string" && delta.content !== "") {
      if (activeKind !== "AssistantSign") {
        yield* finishActiveKind()
        activeKind = "AssistantSign"
      }

      content += delta.content
      yield {
        type: "delta",
        delta: {
          signKind: "AssistantSign",
          content: delta.content,
        },
      }
    }

    if (delta.tool_calls !== undefined && delta.tool_calls.length > 0) {
      yield* finishActiveKind()
    }

    for (const toolCallDelta of delta.tool_calls ?? []) {
      const index = toolCallDelta.index ?? 0
      const toolCall =
        toolCalls.get(index) ??
        ToolCallSign({
          callId: "",
          name: "",
          arguments: "",
        })

      if (toolCallDelta.id !== undefined) {
        toolCall.callId = toolCallDelta.id
      }

      if (toolCallDelta.function?.name !== undefined) {
        toolCall.name += toolCallDelta.function.name
      }

      if (toolCallDelta.function?.arguments !== undefined) {
        toolCall.arguments += toolCallDelta.function.arguments
      }

      toolCalls.set(index, toolCall)
    }
  }

  yield* finishActiveKind()

  if (usage !== undefined) {
    yield { type: "usage", usage }
  }

  for (const [index, toolCall] of [...toolCalls.entries()].sort(
    ([left], [right]) => left - right,
  )) {
    if (toolCall.callId === "") {
      toolCall.callId = `tool-call-${index}`
    }

    yield { type: "sign", sign: toolCall }
  }
}

function makeModelUsage(value: unknown): ModelUsage | undefined {
  const result = UsageSchema.safeParse(value)
  if (!result.success) return undefined

  const usage = result.data
  const input = usage.prompt_tokens
  const output = usage.completion_tokens
  const cacheRead =
    usage.prompt_cache_hit_tokens ??
    usage.prompt_tokens_details?.cached_tokens ??
    0
  const cacheMiss = usage.prompt_cache_miss_tokens ?? input - cacheRead
  const cacheWrite = 0

  return {
    input,
    output,
    cacheRead,
    cacheMiss,
    cacheWrite,
    total: input + output,
    raw: value,
  }
}

function* parseMessage(signs: Array<Sign>): Generator<Message> {
  let index = 0

  while (index < signs.length) {
    const sign = signs[index]
    if (sign === undefined) break

    if (isProviderDataSign(sign)) {
      index += 1
      continue
    }

    if (isToolSign(sign)) {
      index += 1
      continue
    }

    if (isAssistantPartSign(sign)) {
      let reasoning = ""
      let content = ""
      const toolCalls: Array<ToolCallSign> = []

      while (index < signs.length) {
        const part = signs[index]
        if (part === undefined) break

        if (isProviderDataSign(part)) {
          index += 1
          continue
        }

        if (isToolSign(part)) {
          index += 1
          continue
        }

        if (!isAssistantPartSign(part)) break

        if (isReasoningSign(part)) {
          reasoning += part.content
        } else if (isAssistantSign(part)) {
          content += part.content
        } else if (isToolCallSign(part)) {
          toolCalls.push(part)
        }

        index += 1
      }

      const message: Message = {
        role: "assistant",
        content,
      }

      if (reasoning !== "") {
        message.reasoning_content = reasoning
      }

      if (toolCalls.length !== 0) {
        message.tool_calls = toolCalls.map(makeToolCall)
      }

      yield message
      continue
    }

    yield makeMessage(sign)
    index += 1
  }
}

function isAssistantPartSign(
  sign: Sign,
): sign is ReasoningSign | AssistantSign | ToolCallSign {
  return isReasoningSign(sign) || isAssistantSign(sign) || isToolCallSign(sign)
}

function makeMessage(sign: Sign): Message {
  if (isPersonaSign(sign)) {
    return { role: "system", content: sign.content }
  }

  if (isUserSign(sign)) {
    return { role: "user", content: sign.content }
  }

  if (isToolOutputSign(sign)) {
    return {
      role: "tool",
      tool_call_id: sign.callId,
      content: sign.content,
    }
  }

  throw new Error(`[interpret] unexpected message sign: ${sign.kind}`)
}

function makeTool(sign: ToolSign): Tool {
  return {
    type: "function",
    function: {
      name: sign.name,
      description: sign.description,
      parameters: sign.parameters,
    },
  }
}

function makeToolCall(toolCall: ToolCallSign) {
  return {
    id: toolCall.callId,
    type: "function" as const,
    function: {
      name: toolCall.name,
      arguments: toolCall.arguments,
    },
  }
}
