import { z } from "zod"
import { MessageSchema } from "./MessageSchema.ts"

const PromptTokensDetailsSchema = z.object({
  cached_tokens: z.number(),
})

const CompletionTokensDetailsSchema = z.object({
  reasoning_tokens: z.number(),
})

export const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  prompt_tokens_details: PromptTokensDetailsSchema.optional(),
  completion_tokens_details: CompletionTokensDetailsSchema.optional(),
  prompt_cache_hit_tokens: z.number().optional(),
  prompt_cache_miss_tokens: z.number().optional(),
})

export type Usage = z.infer<typeof UsageSchema>

const ChoiceSchema = z.object({
  index: z.number(),
  message: MessageSchema,
  logprobs: z.unknown().nullable(),
  finish_reason: z.string().nullable(),
})

export const ChatCompletionSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion"),
  created: z.number(),
  model: z.string(),
  choices: z.array(ChoiceSchema).nonempty(),
  usage: UsageSchema,
  system_fingerprint: z.string().optional(),
})

export type ChatCompletion = z.infer<typeof ChatCompletionSchema>

const ToolCallDeltaSchema = z.object({
  index: z.number().optional(),
  id: z.string().optional(),
  type: z.literal("function").optional(),
  function: z
    .object({
      name: z.string().optional(),
      arguments: z.string().optional(),
    })
    .optional(),
})

const ChoiceDeltaSchema = z.object({
  role: z.string().optional(),
  content: z.string().nullable().optional(),
  reasoning_content: z.string().nullable().optional(),
  tool_calls: z.array(ToolCallDeltaSchema).optional(),
})

const ChunkChoiceSchema = z.object({
  index: z.number(),
  delta: ChoiceDeltaSchema,
  logprobs: z.unknown().nullable().optional(),
  finish_reason: z.string().nullable().optional(),
})

export const ChatCompletionChunkSchema = z.object({
  id: z.string().optional(),
  object: z.string().optional(),
  created: z.number().optional(),
  model: z.string().optional(),
  choices: z.array(ChunkChoiceSchema).optional(),
  usage: z.unknown().optional(),
})

export type ChatCompletionChunk = z.infer<typeof ChatCompletionChunkSchema>
