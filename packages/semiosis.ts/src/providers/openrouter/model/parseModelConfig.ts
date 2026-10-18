import { z } from "zod"
import type { ModelConfig } from "./ModelConfig.ts"

const defaultModelConfig: Pick<ModelConfig, "pinned"> = {
  pinned: false,
}

const reasoningSchema = z.object({
  effort: z.string().optional(),
  max_tokens: z.number().optional(),
  exclude: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

const modelConfigSchema = z
  .object({
    pinned: z.boolean(),
    reasoning: reasoningSchema.nullable(),
    provider: z.record(z.string(), z.unknown()).nullable(),
    extraBody: z.record(z.string(), z.unknown()),
  })
  .partial()

export function parseModelConfig(name: string, value: unknown): ModelConfig {
  const result = modelConfigSchema.safeParse(value === undefined ? {} : value)
  if (!result.success) {
    throw new Error(
      `[parseModelConfig] invalid model config: ${result.error.message}`,
    )
  }

  const config: ModelConfig = {
    name,
    pinned: result.data.pinned ?? defaultModelConfig.pinned,
  }

  if (result.data.reasoning !== undefined) {
    config.reasoning = result.data.reasoning
  }

  if (result.data.provider !== undefined) {
    config.provider = result.data.provider
  }

  if (result.data.extraBody !== undefined) {
    config.extraBody = result.data.extraBody
  }

  return config
}
