import { unwrap } from "@xieyuheng/std.ts/result"

import type { Database } from "../../database/index.ts"
import { formatModelRef, type Model } from "../../model/index.ts"
import type { Repl, ReplCommand } from "../../repl/Repl.ts"
import type { SessionId } from "../../session/index.ts"
import type { Workspace } from "../../workspace/Workspace.ts"

export function makeInfoCommand(
  repl: Repl,
  options: {
    database: Database
    workspace: Workspace
    model: Model
    sessionId?: SessionId
  },
): ReplCommand {
  return {
    name: "info",
    description: "show session information",
    handler: async () => {
      repl.println(`database: ${options.database.root}`)
      repl.println(`model: ${formatModelRef(options.model)}`)
      repl.println(`workspace: ${options.workspace.name}`)
      repl.println(`  root: ${options.workspace.root}`)

      if (options.sessionId) {
        const session = unwrap(
          await options.database.sessions.get(options.sessionId),
        )
        if (session === undefined) {
          throw new Error(`session not found: ${options.sessionId}`)
        }

        repl.println(`session: ${session.title}`)
        repl.println(`  id: ${session.id}`)
        repl.println(`  context.length: ${session.context.length}`)
      }
    },
  }
}
