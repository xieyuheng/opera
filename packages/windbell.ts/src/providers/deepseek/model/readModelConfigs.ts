import { unwrap } from "@xieyuheng/std.ts/result"

import type { Database } from "../../../database/index.ts"

export async function readModelConfigs(
  database: Database,
): Promise<Record<string, unknown>> {
  const value = unwrap(
    await database.files.readJsonFile(modelConfigsPath(database)),
  )
  if (value === undefined) return {}

  if (typeof value !== "object" || value === null || value instanceof Array) {
    throw new Error("[readModelConfigs] invalid model configs file")
  }

  return value as Record<string, unknown>
}

function modelConfigsPath(database: Database): string {
  return database.path.join(database.providersRoot, "deepseek", "models.json")
}
