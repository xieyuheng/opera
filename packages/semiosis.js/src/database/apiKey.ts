import { err, isError, ok, type Result } from "@windbell/std.js/result"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"
import type { Database } from "./Database.ts"
import { assertId } from "./id.ts"

export function apiKeyPath(database: Database, providerName: string): string {
  assertId(providerName)
  return database.path.join(database.root, ".secrets", "api-keys", providerName)
}

export async function readApiKey(
  database: Database,
  providerName: string,
): Promise<Result<string, DatabaseError>> {
  const valueResult = await database.files.readTextFile(
    apiKeyPath(database, providerName),
  )
  if (isError(valueResult)) return valueResult
  if (valueResult.value === undefined) {
    return err(
      makeDatabaseError({
        type: "api-key-not-found",
        message: `api key not found: ${providerName}`,
        info: { providerName },
      }),
    )
  }

  const key = valueResult.value.trim()
  if (key === "") {
    return err(
      makeDatabaseError({
        type: "api-key-empty",
        message: `api key is empty: ${providerName}`,
        info: { providerName },
      }),
    )
  }

  return ok(key)
}

export async function hasApiKey(
  database: Database,
  providerName: string,
): Promise<Result<boolean, DatabaseError>> {
  const valueResult = await database.files.readTextFile(
    apiKeyPath(database, providerName),
  )
  if (isError(valueResult)) return valueResult
  return ok(valueResult.value !== undefined && valueResult.value.trim() !== "")
}

export async function writeApiKey(
  database: Database,
  providerName: string,
  key: string,
): Promise<Result<void, DatabaseError>> {
  const value = key.trim()
  if (value === "") {
    return err(
      makeDatabaseError({
        type: "api-key-empty",
        message: `api key is empty: ${providerName}`,
        info: { providerName },
      }),
    )
  }

  return await database.files.writeTextFile(
    apiKeyPath(database, providerName),
    `${value}\n`,
  )
}

export async function deleteApiKey(
  database: Database,
  providerName: string,
): Promise<Result<boolean, DatabaseError>> {
  const path = apiKeyPath(database, providerName)
  const existsResult = await database.files.exists(path)
  if (isError(existsResult)) return existsResult
  if (!existsResult.value) return ok(false)

  const removeResult = await database.files.remove(path)
  if (isError(removeResult)) return removeResult
  return ok(true)
}
