import { ok } from "@windbell/std.js/result"
import type { Shell } from "../sh/index.ts"
import { runChildProcess } from "../child-process/runChildProcess.ts"
import { toShellError } from "../child-process/toShellError.ts"
import process from "node:process"

export const defaultBashTimeoutMs = 300_000
export const defaultMaxOutputChars = 200_000

export function makeBash(): Shell {
  return {
    name: "bash",
    async run(command, options) {
      try {
        const output = await runChildProcess({
          executable: "bash",
          args: ["-c", command],
          cwd: options.cwd,
          timeoutMs: options.timeoutMs ?? defaultBashTimeoutMs,
          maxOutputChars: options.maxOutputChars ?? defaultMaxOutputChars,
          env: process.env,
          signal: options.signal,
        })

        return ok(output)
      } catch (error) {
        return {
          kind: "ErrorResult",
          error: toShellError("bash", error, { cwd: options.cwd }),
        }
      }
    },
  }
}
