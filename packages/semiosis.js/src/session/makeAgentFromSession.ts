import { makeAgent, type Agent } from "../agent/index.ts"
import type { Database } from "../database/index.ts"
import type { Model } from "../model/index.ts"
import type { ToolRouter } from "../tool/index.ts"
import { assertSessionShellName } from "../tools/assertSessionShellName.ts"
import type { Workspace } from "../workspace/Workspace.ts"
import type { Session, SessionId } from "./Session.ts"
import { makeSessionContext } from "./makeSessionContext.ts"
import { unwrap } from "@windbell/std.js/result"

export type MakeAgentFromSessionOptions = {
  database: Database
  sessionId: SessionId
  model: Model
  makeToolRouter: (options: {
    session: Session
    workspace: Workspace
  }) => ToolRouter | Promise<ToolRouter>
  shellName?: string
}

export async function makeAgentFromSession(
  options: MakeAgentFromSessionOptions,
): Promise<Agent> {
  const session = unwrap(await options.database.sessions.get(options.sessionId))
  if (session === undefined) {
    throw new Error(
      `[makeAgentFromSession] session not found: ${options.sessionId}`,
    )
  }

  const workspace = unwrap(
    await options.database.workspaces.get(session.workspaceId),
  )
  if (workspace === undefined) {
    throw new Error(
      `[makeAgentFromSession] workspace not found: ${session.workspaceId}`,
    )
  }

  if (options.shellName !== undefined) {
    assertSessionShellName(session.context, options.shellName)
  }

  const toolRouter = await options.makeToolRouter({ session, workspace })

  return makeAgent({
    model: options.model,
    toolRouter,
    ...makeSessionContext({
      session,
      sessionStore: options.database.sessions,
    }),
  })
}
