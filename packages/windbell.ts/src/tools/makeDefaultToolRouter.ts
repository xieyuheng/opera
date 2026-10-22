import process from "node:process"

import { makeToolRouter, type ToolRouter } from "../tool/index.ts"
import { makeBashToolHandler, makeBashToolSign } from "./bash/index.ts"
import { makePwshToolHandler, makePwshToolSign } from "./pwsh/index.ts"

export type ShellDialect = "bash" | "pwsh"

export function platformShellName(
  platform: NodeJS.Platform = process.platform,
): ShellDialect {
  return platform === "win32" ? "pwsh" : "bash"
}

const defaultBashToolDescription = `Run commands in a bash shell.
* When invoking this tool, the contents of the "command" parameter does NOT need to be XML-escaped.
* Network access depends on the task environment. Prefer configured mirrors/proxies when they are available.
* Shell state is not persistent across calls. Use \`cd <dir> && <command>\` when you need a specific working directory.
* To inspect a particular line range of a file, e.g. lines 10-25, try 'sed -n 10,25p /path/to/the/file'.
* Please avoid commands that may produce a very large amount of output.`

const defaultPwshToolDescription = `Run commands in a PowerShell shell.
* When invoking this tool, the contents of the "command" parameter does NOT need to be XML-escaped.
* Network access depends on the task environment. Prefer configured mirrors/proxies when they are available.
* Shell state is not persistent across calls. Use \`Set-Location <dir>; <command>\` when you need a specific working directory.
* Use native Windows paths (C:\\...) and $env:NAME variables; this is PowerShell, not bash.
* To inspect a particular line range of a file, use \`Get-Content <file> | Select-Object -Skip <n> -First <m>\`.
* Please avoid commands that may produce a very large amount of output.`

export type DefaultToolRouterOptions = {
  cwd: string
  timeoutMs?: number
  maxOutputChars?: number
}

export function makeDefaultToolRouter(
  options: DefaultToolRouterOptions,
): ToolRouter {
  const toolRouter = makeToolRouter()
  const name = platformShellName()
  const timeoutMs = options.timeoutMs ?? 300_000
  const maxOutputChars = options.maxOutputChars ?? 200_000

  if (name === "pwsh") {
    toolRouter.defineTool(
      makePwshToolSign({
        description: defaultPwshToolDescription,
      }),
      makePwshToolHandler({
        cwd: options.cwd,
        timeoutMs,
        maxOutputChars,
      }),
    )
  } else {
    toolRouter.defineTool(
      makeBashToolSign({
        description: defaultBashToolDescription,
      }),
      makeBashToolHandler({
        cwd: options.cwd,
        timeoutMs,
        maxOutputChars,
      }),
    )
  }

  return toolRouter
}
