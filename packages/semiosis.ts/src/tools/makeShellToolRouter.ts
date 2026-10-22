import type { Shell } from "@xieyuheng/sh.ts/sh"

import {
  makeToolRouter,
  type ToolHandler,
  type ToolRouter,
} from "../tool/index.ts"
import { makeBashToolSign } from "./bash/makeBashToolSign.ts"
import { formatShellOutput } from "./formatShellOutput.ts"
import { makePwshToolSign } from "./pwsh/makePwshToolSign.ts"

const defaultDescription = "Run a command in a shell."

export type MakeShellToolRouterOptions = {
  sh: Shell
  cwd: string
  timeoutMs?: number
  maxOutputChars?: number
}

export function makeShellToolRouter(
  options: MakeShellToolRouterOptions,
): ToolRouter {
  const toolRouter = makeToolRouter()
  const timeoutMs = options.timeoutMs ?? 300_000
  const maxOutputChars = options.maxOutputChars ?? 200_000
  const handler = makeShellToolHandler({
    sh: options.sh,
    cwd: options.cwd,
    timeoutMs,
    maxOutputChars,
  })

  if (options.sh.name === "bash") {
    toolRouter.defineTool(
      makeBashToolSign({ description: defaultDescription }),
      handler,
    )
    return toolRouter
  }

  if (options.sh.name === "pwsh") {
    toolRouter.defineTool(
      makePwshToolSign({ description: defaultDescription }),
      handler,
    )
    return toolRouter
  }

  throw new Error(`[makeShellToolRouter] unknown shell: ${options.sh.name}`)
}

type MakeShellToolHandlerOptions = {
  sh: Shell
  cwd: string
  timeoutMs: number
  maxOutputChars: number
}

function makeShellToolHandler(
  options: MakeShellToolHandlerOptions,
): ToolHandler {
  return async (args, handlerOptions) => {
    const command = args.command as string
    const result = await options.sh.run(command, {
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
