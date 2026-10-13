import type { Database } from "../database/index.ts"
import type { Model } from "../model/index.ts"
import type { Workspace } from "../workspace/Workspace.ts"
import { PersonaSign } from "../sign/index.ts"
import { withSessionLock } from "../session/sessionLock.ts"
import { createSession, makeAgentFromSession } from "../session/index.ts"
import { makeDefaultToolRouter } from "../tools/makeDefaultToolRouter.ts"
import { makeExitCommand } from "./commands/ExitCommand.ts"
import { makeHelpCommand } from "./commands/HelpCommand.ts"
import { makeInfoCommand } from "./commands/InfoCommand.ts"
import {
  generateAndPrintTitle,
  makeTitleCommand,
} from "./commands/TitleCommand.ts"
import { makeAgentReplInputHandler } from "./AgentReplInputHandler.ts"
import type { Repl } from "../repl/Repl.ts"
import { makeTitleChangeHandler } from "./shared.ts"

export type StartAgentReplOptions = {
  database: Database
  workspace: Workspace
  model: Model
  repl: Repl
}

export async function startAgentRepl(
  options: StartAgentReplOptions,
): Promise<void> {
  const repl = options.repl

  try {
    const toolRouter = makeDefaultToolRouter({
      cwd: options.workspace.root,
    })
    const initialSigns = [
      ...toolRouter.toolSigns,
      PersonaSign("You are a helpful software engineer assistant."),
    ]

    repl.registerCommand(makeExitCommand(repl))
    repl.registerCommand(makeHelpCommand(repl))
    repl.registerCommand(
      makeInfoCommand(repl, {
        database: options.database,
        workspace: options.workspace,
        model: options.model,
      }),
    )

    const firstInput = await readFirstInput(repl, "> ")
    if (firstInput === undefined) {
      repl.close()
      return
    }

    const session = await createSession({
      database: options.database,
      workspace: options.workspace,
      title: "untitled",
      initialSigns,
    })

    await withSessionLock({
      database: options.database,
      sessionId: session.id,
      action: async () => {
        const agent = await makeAgentFromSession({
          database: options.database,
          sessionId: session.id,
          model: options.model,
          makeToolRouter: () => toolRouter,
        })

        const inputHandler = makeAgentReplInputHandler(agent, repl)

        await inputHandler(firstInput)
        await generateAndPrintTitle(agent, repl, {
          onTitleChange: makeTitleChangeHandler(options.database, session),
        })

        repl.registerCommand(
          makeTitleCommand(agent, repl, {
            onTitleChange: makeTitleChangeHandler(options.database, session),
          }),
        )
        repl.registerCommand(
          makeInfoCommand(repl, {
            database: options.database,
            workspace: options.workspace,
            model: options.model,
            sessionId: session.id,
          }),
        )

        await repl.run(inputHandler, "> ")
      },
    })
  } catch (error) {
    repl.close()
    throw error
  }
}

async function readFirstInput(
  repl: Repl,
  prompt: string,
): Promise<string | undefined> {
  while (true) {
    const result = await repl.readInput(prompt)
    if (result.kind === "end") return undefined

    const line = result.input
    if (line.trim() === "") continue

    if (await repl.tryDispatchCommand(line)) continue

    return line
  }
}
