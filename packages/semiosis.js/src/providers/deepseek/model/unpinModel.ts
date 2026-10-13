import type { Database } from "../../../database/index.ts"
import { parseModelConfig } from "./parseModelConfig.ts"
import { readModelConfigs } from "./readModelConfigs.ts"
import { unwrap } from "@windbell/std.js/result"

export async function unpinModel(
  database: Database,
  name: string,
): Promise<boolean> {
  const configs = await readModelConfigs(database)

  if (!Object.hasOwn(configs, name)) return false

  const config = parseModelConfig(name, configs[name])
  if (!config.pinned) return false

  configs[name] = {
    ...(configs[name] as Record<string, unknown>),
    pinned: false,
  }

  unwrap(
    await database.files.writeJsonFile(modelConfigsPath(database), configs),
  )
  return true
}

function modelConfigsPath(database: Database): string {
  return database.path.join(database.providersRoot, "deepseek", "models.json")
}
