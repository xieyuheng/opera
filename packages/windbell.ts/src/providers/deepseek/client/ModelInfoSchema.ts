import { z } from "zod"

export const ModelInfoSchema = z.object({
  id: z.string(),
  object: z.literal("model"),
  owned_by: z.string(),
  name: z.string(),
  context_window: z.number(),
  max_output_tokens: z.number(),
  input_modalities: z.array(z.string()),
  output_modalities: z.array(z.string()),
  effort: z
    .object({
      supported_levels: z.array(z.string()),
      default_level: z.string().optional(),
    })
    .optional(),
  api_capabilities: z.record(z.string(), z.unknown()).optional(),
})

export type ModelInfo = z.infer<typeof ModelInfoSchema>
