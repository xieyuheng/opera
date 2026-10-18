import type { Message } from "./MessageSchema.ts"
import type { Tool } from "./Tool.ts"

export type ChatCompletionInput = {
  model: string
  messages: Array<Message>
  tools: Array<Tool>
  thinking: {
    type: "enabled" | "disabled"
  }
  reasoning_effort: "none" | "low" | "high" | "max"
  stream?: boolean
}
