import type { Result } from "@windbell/std.ts/result"

import type { ShellError } from "./ShellError.ts"
import type { ShellOutput } from "./ShellOutput.ts"

export type ShellRunOptions = {
  cwd: string
  timeoutMs?: number
  maxOutputChars?: number
  signal?: AbortSignal
}

export type Shell = {
  name: string
  run(
    command: string,
    options: ShellRunOptions,
  ): Promise<Result<ShellOutput, ShellError>>
}
