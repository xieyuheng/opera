import type { Database } from "../../../database/index.ts"
import { parseModelConfig } from "./parseModelConfig.ts"
import { readModelConfigs } from "./readModelConfigs.ts"

export async function listModelConfigs(
  database: Database,
): Promise<Array<string>> {
  const configs = await readModelConfigs(database)

  return Object.keys(configs)
    .filter((name) => parseModelConfig(name, configs[name]).pinned)
    .sort()
}
