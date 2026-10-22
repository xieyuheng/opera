import { z } from "zod"

const AliasTargetSchema = z.object({
  name: z.string(),
  slug: z.string(),
})

const ArtificialAnalysisSchema = z.object({
  intelligence_index: z.number().nullable().optional(),
  coding_index: z.number().nullable().optional(),
  agentic_index: z.number().nullable().optional(),
})

const BenchmarksSchema = z.object({
  design_arena: z.array(z.unknown()).optional(),
  artificial_analysis: ArtificialAnalysisSchema.optional(),
})

export const ModelInfoSchema = z.object({
  id: z.string(),
  canonical_slug: z.string().nullable().optional(),
  hugging_face_id: z.string().nullable().optional(),
  name: z.string(),
  created: z.number().optional(),
  description: z.string().optional(),
  context_length: z.number(),
  alias_target: AliasTargetSchema.nullable().optional(),
  benchmarks: BenchmarksSchema.nullable().optional(),
  architecture: z.object({
    modality: z.string().optional(),
    input_modalities: z.array(z.string()),
    output_modalities: z.array(z.string()),
    tokenizer: z.string().nullable().optional(),
    instruct_type: z.string().nullable().optional(),
  }),
  pricing: z.record(z.string(), z.unknown()),
  top_provider: z
    .object({
      context_length: z.number().nullable().optional(),
      max_completion_tokens: z.number().nullable().optional(),
      is_moderated: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  per_request_limits: z.unknown().optional(),
  supported_parameters: z.array(z.string()),
  default_parameters: z.record(z.string(), z.unknown()).nullable().optional(),
  supported_voices: z.unknown().optional(),
  knowledge_cutoff: z.string().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  links: z
    .object({
      details: z.string().optional(),
    })
    .nullable()
    .optional(),
  reasoning: z
    .object({
      mandatory: z.boolean().optional(),
      default_enabled: z.boolean().optional(),
      supported_efforts: z.array(z.string()).optional(),
      default_effort: z.string().nullable().optional(),
      supports_max_tokens: z.boolean().optional(),
    })
    .nullable()
    .optional(),
})

export type ModelInfo = z.infer<typeof ModelInfoSchema>
