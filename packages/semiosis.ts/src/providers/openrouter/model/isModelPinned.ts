import type { Database } from "../../../database/index.ts"
import { parseModelConfig } from "./parseModelConfig.ts"
import { readModelConfigs } from "./readModelConfigs.ts"

export async function isModelPinned(
  database: Database,
  name: string,
): Promise<boolean> {
  const configs = await readModelConfigs(database)
  if (!Object.hasOwn(configs, name)) return false

  return parseModelConfig(name, configs[name]).pinned
}
