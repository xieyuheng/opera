import {
  UsageSchema,
  type ChatCompletionInput,
  type Client,
  type Message,
  type Tool,
} from "../client/index.ts"
import type {
  ModelInterpretEvent,
  ModelInterpretOptions,
  ModelUsage,
} from "../../../model/index.ts"
import {
  AssistantSign,
  ProviderDataSign,
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
  }

  if (config.reasoning !== undefined) {
    request.reasoning = config.reasoning
  }

  if (config.provider !== undefined) {
    request.provider = config.provider
  }

  if (config.extraBody !== undefined) {
    request.extraBody = config.extraBody
  }

  let reasoning = ""
  let content = ""
  let activeKind: "ReasoningSign" | "AssistantSign" | undefined
  let reasoningDetailsEmitted = false
  let usage: ModelUsage | undefined
  const reasoningDetails: Array<Record<string, unknown>> = []
  const toolCalls = new Map<number, ToolCallSign>()

  function* finishReasoningDetails(): Generator<ModelInterpretEvent> {
    if (reasoningDetailsEmitted) return

    const details = reasoningDetails.filter(
      (detail): detail is Record<string, unknown> => detail !== undefined,
    )

    if (details.length !== 0) {
      reasoningDetailsEmitted = true
      yield {
        type: "sign",
        sign: ProviderDataSign({
          provider: "openrouter",
          field: "reasoning_details",
          data: details,
        }),
      }
    }
  }

  function* finishActiveKind(): Generator<ModelInterpretEvent> {
    if (activeKind === "ReasoningSign") {
      if (reasoning !== "") {
        yield { type: "sign", sign: ReasoningSign(reasoning) }
      }
      yield* finishReasoningDetails()
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

    if (typeof delta.reasoning === "string" && delta.reasoning !== "") {
      if (activeKind !== "ReasoningSign") {
        yield* finishActiveKind()
        activeKind = "ReasoningSign"
      }

      reasoning += delta.reasoning
      yield {
        type: "delta",
        delta: {
          signKind: "ReasoningSign",
          content: delta.reasoning,
        },
      }
    }

    if (delta.reasoning_details !== undefined) {
      addReasoningDetails(reasoningDetails, delta.reasoning_details)
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
  yield* finishReasoningDetails()

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
  const cacheRead = usage.prompt_tokens_details?.cached_tokens ?? 0
  const cacheWrite = usage.prompt_tokens_details?.cache_write_tokens ?? 0
  const cacheMiss = input - cacheRead - cacheWrite

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

function addReasoningDetails(
  target: Array<Record<string, unknown>>,
  value: unknown,
): void {
  if (!Array.isArray(value)) return

  for (const item of value) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      continue
    }

    const detail = item as Record<string, unknown>
    const index =
      typeof detail.index === "number" ? detail.index : target.length
    const existing = target[index]

    if (existing === undefined) {
      target[index] = { ...detail }
      continue
    }

    for (const [key, next] of Object.entries(detail)) {
      if (
        key === "text" &&
        typeof next === "string" &&
        typeof existing.text === "string"
      ) {
        existing.text += next
      } else {
        existing[key] = next
      }
    }
  }
}

function* parseMessage(signs: Array<Sign>): Generator<Message> {
  let index = 0

  while (index < signs.length) {
    const sign = signs[index]
    if (sign === undefined) break

    if (isToolSign(sign)) {
      index += 1
      continue
    }

    if (isAssistantPartSign(sign)) {
      let reasoning = ""
      let content = ""
      let reasoningDetails: Array<unknown> | undefined
      const toolCalls: Array<ToolCallSign> = []

      while (index < signs.length) {
        const part = signs[index]
        if (part === undefined) break

        if (isToolSign(part)) {
          index += 1
          continue
        }

        if (!isAssistantPartSign(part)) break

        if (isReasoningSign(part)) {
          reasoning += part.content
        } else if (isProviderDataSign(part)) {
          if (
            part.provider === "openrouter" &&
            part.field === "reasoning_details" &&
            Array.isArray(part.data)
          ) {
            reasoningDetails = part.data
          }
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

      if (reasoningDetails !== undefined) {
        message.reasoning_details = reasoningDetails
      } else if (reasoning !== "") {
        message.reasoning = reasoning
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
): sign is ReasoningSign | AssistantSign | ProviderDataSign | ToolCallSign {
  return (
    isReasoningSign(sign) ||
    isAssistantSign(sign) ||
    isProviderDataSign(sign) ||
    isToolCallSign(sign)
  )
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
