import { makeLocalBash } from "@windbell/sh.js/local-sh"
import { formatShellOutput } from "../formatShellOutput.ts"
import type { ToolHandler } from "../../tool/index.ts"

export type BashToolHandlerOptions = {
  cwd: string
  timeoutMs: number
  maxOutputChars: number
}

export function makeBashToolHandler(
  options: BashToolHandlerOptions,
): ToolHandler {
  const sh = makeLocalBash()

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
