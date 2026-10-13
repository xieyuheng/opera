import type { JsonObject } from "@windbell/std.js/json"
import type { ShellError } from "../sh/index.ts"

const errorTypeByCode: Record<string, string> = {
  ENOENT: "not-found",
  EACCES: "permission-denied",
  EPERM: "permission-denied",
  EINVAL: "invalid-argument",
  ENOTDIR: "not-a-directory",
  EISDIR: "is-a-directory",
}

export function toShellError(
  who: string,
  error: unknown,
  info: JsonObject = {},
): ShellError {
  const code = readErrorCode(error)
  const shellError: ShellError = {
    type: errorTypeFromError(error),
    who,
    message: errorMessage(error),
  }

  if (Object.keys(info).length > 0 || code !== undefined) {
    shellError.info = { ...info }
  }

  if (code !== undefined && shellError.info !== undefined) {
    shellError.info.code = code
  }

  return shellError
}

function errorTypeFromError(error: unknown): string {
  if (error instanceof Error && error.name === "AbortError") {
    return "aborted"
  }

  const code = readErrorCode(error)
  if (code === undefined) return "unknown"

  return errorTypeByCode[code] ?? "unknown"
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function readErrorCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined

  const code = (error as NodeJS.ErrnoException).code
  return typeof code === "string" ? code : undefined
}
