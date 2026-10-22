import type { Message } from "./MessageSchema.ts"
import type { Tool } from "./Tool.ts"

export type Reasoning = {
  effort?: string
  max_tokens?: number
  exclude?: boolean
  enabled?: boolean
}

export type ChatCompletionInput = {
  model: string
  messages: Array<Message>
  tools: Array<Tool>
  reasoning?: Reasoning | null
  provider?: Record<string, unknown> | null
  extraBody?: Record<string, unknown>
  stream?: boolean
}
