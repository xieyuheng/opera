import { HttpRequestError, requestJson } from "@windbell/http.js"
import type { JsonObject } from "@windbell/std.js/json"
import { err, type Result } from "@windbell/std.js/result"
import type { Shell, ShellError, ShellOutput } from "../../sh/index.ts"

export type HttpShellConfig = {
  baseUrl: string
}

export function makeHttpShell(config: HttpShellConfig, name: string): Shell {
  return {
    name,
    async run(command, options) {
      try {
        return await requestJson<Result<ShellOutput, ShellError>>({
          baseUrl: config.baseUrl,
          method: "POST",
          path: `/${encodeURIComponent(name)}`,
          body: {
            command,
            cwd: options.cwd,
            timeoutMs: options.timeoutMs,
            maxOutputChars: options.maxOutputChars,
          },
          signal: options.signal,
        })
      } catch (error) {
        return err(toHttpShellError(name, error, { cwd: options.cwd }))
      }
    },
  }
}

function toHttpShellError(
  who: string,
  error: unknown,
  info: JsonObject,
): ShellError {
  if (error instanceof HttpRequestError) {
    const errorInfo: JsonObject = { ...info }

    if (error.status !== undefined) {
      errorInfo.status = error.status
    }

    return {
      type: "http-error",
      who,
      message: error.message,
      info: errorInfo,
    }
  }

  if (error instanceof Error && error.name === "AbortError") {
    return {
      type: "aborted",
      who,
      message: error.message,
      info,
    }
  }

  return {
    type: "unknown",
    who,
    message: error instanceof Error ? error.message : String(error),
    info,
  }
}
