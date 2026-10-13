import { repairOrphanToolCalls } from "../agent/index.ts"
import type { Database } from "../database/index.ts"
import { formatSign } from "../format/index.ts"
import type { Model } from "../model/index.ts"
import type { Workspace } from "../workspace/Workspace.ts"
import {
  loadSession,
  makeAgentFromSession,
  withSessionLock,
  type SessionId,
} from "../session/index.ts"
import { makeDefaultToolRouter } from "../tools/index.ts"
import { makeExitCommand } from "./commands/ExitCommand.ts"
import { makeHelpCommand } from "./commands/HelpCommand.ts"
import { makeInfoCommand } from "./commands/InfoCommand.ts"
import { makeTitleCommand } from "./commands/TitleCommand.ts"
import { makeAgentReplInputHandler } from "./AgentReplInputHandler.ts"
import type { Repl } from "../repl/Repl.ts"
import { makeTitleChangeHandler } from "./shared.ts"

export type ResumeAgentReplOptions = {
  database: Database
  workspace: Workspace
  model: Model
  repl: Repl
  sessionId: SessionId
}

export async function resumeAgentRepl(
  options: ResumeAgentReplOptions,
): Promise<void> {
  const toolRouter = makeDefaultToolRouter({
    cwd: options.workspace.root,
  })
  const session = await loadSession({
    database: options.database,
    workspace: options.workspace,
    sessionId: options.sessionId,
  })
  const repl = options.repl

  try {
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

        await repairOrphanToolCalls(agent)

        for (const sign of await agent.getContext()) {
          repl.println(formatSign(sign, { color: repl.useColor }))
        }

        const inputHandler = makeAgentReplInputHandler(agent, repl)

        repl.registerCommand(makeExitCommand(repl))
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

        repl.registerCommand(makeHelpCommand(repl))

        await repl.run(inputHandler, "> ")
      },
    })
  } catch (error) {
    repl.close()
    throw error
  }
}
