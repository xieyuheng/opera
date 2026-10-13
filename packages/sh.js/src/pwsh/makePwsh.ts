import process from "node:process"
import { ok } from "@windbell/std.js/result"
import type { Shell } from "../sh/index.ts"
import { resolvePwshPath } from "./resolvePwshPath.ts"
import { runChildProcess } from "../child-process/runChildProcess.ts"
import { toShellError } from "../child-process/toShellError.ts"

export const defaultPwshTimeoutMs = 300_000
export const defaultPwshMaxOutputChars = 200_000

const encodingPreamble =
  "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); " +
  "$OutputEncoding = [System.Text.UTF8Encoding]::new($false); "

const envOverrides = {
  NO_COLOR: "1",
  PAGER: "cat",
  GIT_PAGER: "cat",
}

export type MakePwshOptions = {
  executable?: string
}

export function makePwsh(options: MakePwshOptions = {}): Shell {
  return {
    name: "pwsh",
    async run(command, runOptions) {
      try {
        const output = await runChildProcess({
          executable: resolvePwshPath(options.executable),
          args: [
            "-NoLogo",
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            `${encodingPreamble}${command}`,
          ],
          cwd: runOptions.cwd,
          timeoutMs: runOptions.timeoutMs ?? defaultPwshTimeoutMs,
          maxOutputChars:
            runOptions.maxOutputChars ?? defaultPwshMaxOutputChars,
          env: {
            ...process.env,
            ...envOverrides,
          },
          signal: runOptions.signal,
        })

        return ok(output)
      } catch (error) {
        return {
          kind: "ErrorResult",
          error: toShellError("pwsh", error, { cwd: runOptions.cwd }),
        }
      }
    },
  }
}
