export type StoredRangerLocation = {
  currentDirectory: string
  selectedPath: string | null
}

export function readStoredRangerLocation(
  storageKey: string,
): StoredRangerLocation | undefined {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === null) return undefined

    const value: unknown = JSON.parse(raw)
    if (value === null || typeof value !== "object") return undefined

    const record = value as Record<string, unknown>
    const currentDirectory = record.currentDirectory
    const selectedPath = record.selectedPath

    if (typeof currentDirectory !== "string" || currentDirectory === "") {
      return undefined
    }

    if (
      selectedPath !== undefined &&
      selectedPath !== null &&
      typeof selectedPath !== "string"
    ) {
      return undefined
    }

    return {
      currentDirectory,
      selectedPath: selectedPath ?? null,
    }
  } catch {
    return undefined
  }
}

export function writeStoredRangerLocation(
  storageKey: string,
  location: StoredRangerLocation,
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(location))
  } catch {
    // ignore storage errors
  }
}
