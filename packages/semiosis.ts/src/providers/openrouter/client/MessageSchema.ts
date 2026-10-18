import { z } from "zod"
import { ToolCallSchema } from "./ToolCallSchema.ts"

export const MessageSchema = z.object({
  role: z.union([
    z.literal("system"),
    z.literal("user"),
    z.literal("assistant"),
    z.literal("tool"),
  ]),
  content: z.string().nullable().optional(),
  refusal: z.string().nullable().optional(),
  reasoning: z.string().nullable().optional(),
  reasoning_details: z.array(z.unknown()).nullable().optional(),
  tool_calls: z.array(ToolCallSchema).nullable().optional(),
  tool_call_id: z.string().optional(),
})

export type Message = z.infer<typeof MessageSchema>
