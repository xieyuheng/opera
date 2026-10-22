import process from "node:process"

import type * as Cli from "@xieyuheng/cli.ts"

import { resumeAgentRepl, startAgentRepl } from "../../agent-repl/index.ts"
import type { Database } from "../../database/index.ts"
import { makeTtyRepl } from "../../repls/index.ts"
import { loadSessionWorkspace } from "../../session/index.ts"
import { readOptionalOption } from "../options.ts"
import { ensureWorkspace, makeModelFromOptions } from "../shared.ts"

export type ReplCommandOptions = {
  database: Database
  lockRoot: string
}

export function makeReplHandler(options: ReplCommandOptions) {
  return async (context: Cli.HandlerContext) => {
    const model = await makeModelFromOptions({
      database: options.database,
      cliOptions: context.options,
    })
    const sessionId = readOptionalOption(context.options, "--session")
    const workspace =
      sessionId === undefined
        ? await ensureWorkspace({
            database: options.database,
            cwd: process.cwd(),
          })
        : await loadSessionWorkspace({
            database: options.database,
            sessionId,
          })

    printReplHeader({
      name: context.router.name,
      version: context.router.version,
    })

    const repl = makeTtyRepl()

    if (sessionId === undefined) {
      return startAgentRepl({
        database: options.database,
        lockRoot: options.lockRoot,
        workspace,
        model,
        repl,
      })
    }

    return resumeAgentRepl({
      database: options.database,
      lockRoot: options.lockRoot,
      workspace,
      model,
      repl,
      sessionId,
    })
  }
}

function printReplHeader(options: { name: string; version: string }): void {
  console.log(`${options.name} ${options.version}`)
  console.log()
}
