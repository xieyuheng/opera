import { unwrap } from "@xieyuheng/std.ts/result"

import type { Database } from "../../../database/index.ts"
import { parseModelConfig } from "./parseModelConfig.ts"
import { readModelConfigs } from "./readModelConfigs.ts"

export async function pinModel(
  database: Database,
  name: string,
): Promise<void> {
  const configs = await readModelConfigs(database)

  if (Object.hasOwn(configs, name)) {
    const config = parseModelConfig(name, configs[name])
    if (config.pinned) return

    configs[name] = {
      ...(configs[name] as Record<string, unknown>),
      pinned: true,
    }
  } else {
    configs[name] = { pinned: true }
  }

  unwrap(
    await database.files.writeJsonFile(modelConfigsPath(database), configs),
  )
}

function modelConfigsPath(database: Database): string {
  return database.path.join(database.providersRoot, "openrouter", "models.json")
}
