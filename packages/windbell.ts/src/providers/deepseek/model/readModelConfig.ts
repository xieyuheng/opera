import type { Database } from "../../../database/index.ts"
import type { ModelConfig } from "./ModelConfig.ts"
import { parseModelConfig } from "./parseModelConfig.ts"
import { readModelConfigs } from "./readModelConfigs.ts"

export async function readModelConfig(
  database: Database,
  name: string,
): Promise<ModelConfig> {
  const configs = await readModelConfigs(database)
  const value = Object.hasOwn(configs, name) ? configs[name] : undefined

  return parseModelConfig(name, value)
}
