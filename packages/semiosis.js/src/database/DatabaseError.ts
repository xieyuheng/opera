import type { FileSystemError, FileSystemErrorType } from "@windbell/fs.js/fs"
import { ResultUnwrapError, err, type Result } from "@windbell/std.js/result"

export type DatabaseErrorType =
  | FileSystemErrorType
  | "invalid-id"
  | "invalid-json"
  | "workspace-root-already-exists"
  | "workspace-not-found"
  | "workspace-already-exists"
  | "workspace-already-in-dustbin"
  | "workspace-not-in-dustbin"
  | "session-not-found"
  | "session-already-in-dustbin"
  | "session-not-in-dustbin"
  | "provider-name-mismatch"
  | "api-key-not-found"
  | "api-key-empty"
  | "unknown"

export type DatabaseError = {
  type: DatabaseErrorType
  message: string
  info?: Record<string, unknown>
}

export function makeDatabaseError(error: DatabaseError): DatabaseError {
  return error
}

export function makeDatabaseErrorFromFileSystemError(
  error: FileSystemError,
): DatabaseError {
  return {
    type: error.type,
    message: error.message,
    info: {
      ...(error.info ?? {}),
      who: error.who,
    },
  }
}

export function makeDatabaseErrorFromUnknown(error: unknown): DatabaseError {
  if (isDatabaseError(error)) return error

  if (error instanceof ResultUnwrapError) {
    return makeDatabaseErrorFromUnknown(error.error)
  }

  if (isFileSystemError(error)) {
    return makeDatabaseErrorFromFileSystemError(error)
  }

  if (error instanceof SyntaxError) {
    return makeDatabaseError({
      type: "invalid-json",
      message: error.message,
    })
  }

  if (error instanceof Error) {
    if (error.message.includes("invalid id")) {
      return makeDatabaseError({
        type: "invalid-id",
        message: error.message,
      })
    }

    return makeDatabaseError({
      type: "unknown",
      message: error.message,
    })
  }

  return makeDatabaseError({
    type: "unknown",
    message: String(error),
  })
}

export function isDatabaseError(value: unknown): value is DatabaseError {
  if (value === null || typeof value !== "object") return false

  const type = (value as { type?: unknown }).type
  const message = (value as { message?: unknown }).message
  return typeof type === "string" && typeof message === "string"
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
