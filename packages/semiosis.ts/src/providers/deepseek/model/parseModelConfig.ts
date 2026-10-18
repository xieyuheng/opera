import { z } from "zod"
import type { ModelConfig } from "./ModelConfig.ts"

const defaultModelConfig: Omit<ModelConfig, "name"> = {
  pinned: false,
  thinking: "enabled",
  reasoningEffort: "high",
}

const modelConfigSchema = z
  .object({
    pinned: z.boolean(),
    thinking: z.enum(["enabled", "disabled"]),
    reasoningEffort: z.enum(["none", "low", "high", "max"]),
  })
  .partial()

export function parseModelConfig(name: string, value: unknown): ModelConfig {
  const result = modelConfigSchema.safeParse(value === undefined ? {} : value)
  if (!result.success) {
    throw new Error(
      `[parseModelConfig] invalid model config: ${result.error.message}`,
    )
  }

  return {
    name,
    pinned: result.data.pinned ?? defaultModelConfig.pinned,
    thinking: result.data.thinking ?? defaultModelConfig.thinking,
    reasoningEffort:
      result.data.reasoningEffort ?? defaultModelConfig.reasoningEffort,
  }
}
