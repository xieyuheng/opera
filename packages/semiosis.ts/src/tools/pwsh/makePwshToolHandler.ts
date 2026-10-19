import { makePwsh } from "@windbell/sh.ts/pwsh"

import type { ToolHandler } from "../../tool/index.ts"
import { formatShellOutput } from "../formatShellOutput.ts"

export type PwshToolHandlerOptions = {
  cwd: string
  timeoutMs: number
  maxOutputChars: number
  executable?: string
}

export function makePwshToolHandler(
  options: PwshToolHandlerOptions,
): ToolHandler {
  const sh = makePwsh({ executable: options.executable })

  return async (args, handlerOptions) => {
    const command = args.command as string
    const result = await sh.run(command, {
      cwd: options.cwd,
      timeoutMs: options.timeoutMs,
      maxOutputChars: options.maxOutputChars,
      signal: handlerOptions.signal,
    })

    if (result.kind === "ErrorResult") {
      throw new Error(result.error.message)
    }

    return formatShellOutput(result.value, options.timeoutMs)
  }
}
