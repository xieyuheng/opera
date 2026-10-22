import Path from "node:path"
import process from "node:process"

import type * as Cli from "@xieyuheng/cli.ts"
import { errorReport } from "@xieyuheng/std.ts/error"

import { agentInterpret } from "../../agent/index.ts"
import type { Database } from "../../database/index.ts"
import { formatSign } from "../../format/index.ts"
import { readPromptBatch } from "../../prompts/index.ts"
import { getOrMakeSession } from "../../session/index.ts"
import { withSessionLock } from "../../session/sessionLock.ts"
import { PersonaSign, UserSign, type Sign } from "../../sign/index.ts"
import { makeDefaultToolRouter } from "../../tools/makeDefaultToolRouter.ts"
import {
  parsePositiveInt,
  readOptionalOption,
  readRequiredOption,
} from "../options.ts"
import {
  ensureWorkspace,
  makeAgentForCli,
  makeModelFromOptions,
} from "../shared.ts"

export type BatchCommandOptions = {
  database: Database
  lockRoot: string
}

export function makeBatchHandler(options: BatchCommandOptions) {
  return async (context: Cli.HandlerContext) => {
    const model = await makeModelFromOptions({
      database: options.database,
      cliOptions: context.options,
    })

    const promptsPath = readRequiredOption(context.options, "--prompts")
    const promptBatch = readPromptBatch(promptsPath)

    const cwd = Path.resolve(
      readOptionalOption(context.options, "--cwd") ?? process.cwd(),
    )
    const workspace = await ensureWorkspace({
      database: options.database,
      cwd,
    })

    const maxOutputChars = parsePositiveInt(
      context.options["--max-output-chars"],
      200_000,
    )

    const personaSign = PersonaSign(promptBatch.system)
    const toolRouter = makeDefaultToolRouter({
      cwd: workspace.root,
      maxOutputChars,
    })

    const initialSigns: Array<Sign> = [...toolRouter.toolSigns, personaSign]

    const session = await getOrMakeSession({
      database: options.database,
      workspace,
      title: "untitled",
      initialSigns,
    })

    for (const sign of toolRouter.toolSigns) {
      console.log(formatSign(sign))
    }
    console.log(formatSign(personaSign))

    await withSessionLock({
      database: options.database,
      lockRoot: options.lockRoot,
      sessionId: session.id,
      action: async () => {
        const agent = await makeAgentForCli({
          database: options.database,
          sessionId: session.id,
          model,
          toolRouter,
        })

        for (const prompt of promptBatch.prompts) {
          const userSign = UserSign(prompt)

          try {
            for await (const event of agentInterpret(agent, [userSign])) {
              if (event.type === "error") {
                console.error(`[error] ${event.error.message}`)
                return
              }

              if (event.type !== "sign") continue

              console.log(formatSign(event.sign))
            }
          } catch (error) {
            console.error(`[error] ${errorReport(error)}`)
            return
          }
        }
      },
    })
  }
}
