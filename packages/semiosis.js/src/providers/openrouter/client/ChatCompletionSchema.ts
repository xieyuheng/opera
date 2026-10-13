import { z } from "zod"
import { MessageSchema } from "./MessageSchema.ts"

const PromptTokensDetailsSchema = z.object({
  cached_tokens: z.number().optional(),
  cache_write_tokens: z.number().optional(),
  audio_tokens: z.number().optional(),
  video_tokens: z.number().optional(),
})

const CompletionTokensDetailsSchema = z.object({
  reasoning_tokens: z.number().optional(),
  image_tokens: z.number().optional(),
  audio_tokens: z.number().optional(),
})

const CostDetailsSchema = z.object({
  upstream_inference_cost: z.number().optional(),
  upstream_inference_prompt_cost: z.number().optional(),
  upstream_inference_completions_cost: z.number().optional(),
})

export const UsageSchema = z.object({
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  total_tokens: z.number(),
  cost: z.number().optional(),
  is_byok: z.boolean().optional(),
  prompt_tokens_details: PromptTokensDetailsSchema.optional(),
  cost_details: CostDetailsSchema.optional(),
  completion_tokens_details: CompletionTokensDetailsSchema.optional(),
})

export type Usage = z.infer<typeof UsageSchema>

const ChoiceSchema = z.object({
  index: z.number(),
  message: MessageSchema,
  logprobs: z.unknown().nullable(),
  finish_reason: z.string().nullable(),
  native_finish_reason: z.string().nullable().optional(),
})

export const ChatCompletionSchema = z.object({
  id: z.string(),
  object: z.literal("chat.completion"),
  created: z.number(),
  model: z.string(),
  provider: z.string(),
  system_fingerprint: z.string().nullable().optional(),
  service_tier: z.string().nullable().optional(),
  choices: z.array(ChoiceSchema).nonempty(),
  usage: UsageSchema,
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
  refusal: z.string().nullable().optional(),
  reasoning: z.string().nullable().optional(),
  reasoning_details: z.array(z.unknown()).nullable().optional(),
  tool_calls: z.array(ToolCallDeltaSchema).optional(),
})

const ChunkChoiceSchema = z.object({
  index: z.number(),
  delta: ChoiceDeltaSchema,
  logprobs: z.unknown().nullable().optional(),
  finish_reason: z.string().nullable().optional(),
  native_finish_reason: z.string().nullable().optional(),
})

export const ChatCompletionChunkSchema = z.object({
  id: z.string().optional(),
  object: z.string().optional(),
  created: z.number().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  choices: z.array(ChunkChoiceSchema).optional(),
  usage: z.unknown().optional(),
})

export type ChatCompletionChunk = z.infer<typeof ChatCompletionChunkSchema>
