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
  reasoning_content: z.string().nullable().optional(),
  tool_calls: z.array(ToolCallSchema).nullable().optional(),
  tool_call_id: z.string().optional(),
})

export type Message = z.infer<typeof MessageSchema>
