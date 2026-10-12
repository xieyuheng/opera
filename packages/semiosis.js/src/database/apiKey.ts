import type { Database } from "./Database.ts"
import { assertId } from "./id.ts"

export function apiKeyPath(database: Database, providerName: string): string {
  assertId(providerName)
  return database.path.join(database.root, ".secrets", "api-keys", providerName)
}

export async function readApiKey(
  database: Database,
  providerName: string,
): Promise<string> {
  const value = await database.files.readTextFile(
    apiKeyPath(database, providerName),
  )
  if (value === undefined) {
    throw new Error(`[readApiKey] api key not found: ${providerName}`)
  }

  const key = value.trim()
  if (key === "") {
    throw new Error(`[readApiKey] api key is empty: ${providerName}`)
  }

  return key
}

export async function hasApiKey(
  database: Database,
  providerName: string,
): Promise<boolean> {
  const value = await database.files.readTextFile(
    apiKeyPath(database, providerName),
  )
  return value !== undefined && value.trim() !== ""
}

export async function writeApiKey(
  database: Database,
  providerName: string,
  key: string,
): Promise<void> {
  const value = key.trim()
  if (value === "") {
    throw new Error(`[writeApiKey] api key is empty: ${providerName}`)
  }

  await database.files.writeTextFile(
    apiKeyPath(database, providerName),
    `${value}\n`,
  )
}

export async function deleteApiKey(
  database: Database,
  providerName: string,
): Promise<boolean> {
  const path = apiKeyPath(database, providerName)
  if (!(await database.files.exists(path))) return false

  await database.files.remove(path)
  return true
}
