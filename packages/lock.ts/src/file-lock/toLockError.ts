import type { FileSystemError } from "@windbell/fs.ts/fs"
import type { JsonObject } from "@windbell/std.ts/json"

import type { LockError } from "../lock/index.ts"

export function toLockError(
  who: string,
  error: unknown,
  info: JsonObject = {},
): LockError {
  if (isFileSystemError(error)) {
    return {
      type: error.type,
      who,
      message: error.message,
      info: { ...info, ...error.info },
    }
  }

  return {
    type: "unknown",
    who,
    message: error instanceof Error ? error.message : String(error),
    info,
  }
}

function isFileSystemError(value: unknown): value is FileSystemError {
  if (value === null || typeof value !== "object") return false

  const record = value as Record<string, unknown>
  return (
    typeof record.type === "string" &&
    typeof record.who === "string" &&
    typeof record.message === "string"
  )
}
