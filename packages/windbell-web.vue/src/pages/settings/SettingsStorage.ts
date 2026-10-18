import { ACCESS_TOKEN_STORAGE_KEY } from "../../app/auth.ts"

export type StorageGroup = "app" | "ranger" | "session" | "other"

export type StorageEntry = {
  key: string
  value: string
  bytes: number
  group: StorageGroup
}

export function readWindbellStorage(): Array<StorageEntry> {
  const entries: Array<StorageEntry> = []

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (key === null || !key.startsWith("windbell.")) continue
    if (key === ACCESS_TOKEN_STORAGE_KEY) continue

    const value = localStorage.getItem(key) ?? ""
    entries.push({
      key,
      value,
      bytes: (key.length + value.length) * 2,
      group: classifyStorageKey(key),
    })
  }

  return entries.sort((left, right) => left.key.localeCompare(right.key))
}

export function clearStorageKeys(keys: Array<string>): void {
  for (const key of keys) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore storage errors
    }
  }
}

export function clearWindbellStorage(): void {
  clearStorageKeys(readWindbellStorage().map((entry) => entry.key))
}

function classifyStorageKey(key: string): StorageGroup {
  if (
    key === "windbell.color-mode" ||
    key === "windbell.font" ||
    key === "windbell.locale"
  ) {
    return "app"
  }

  if (key.startsWith("windbell.ranger.")) return "ranger"
  if (key.startsWith("windbell.session.")) return "session"

  return "other"
}
