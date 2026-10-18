import type { Database } from "../database/index.ts"
import type { Sign } from "../sign/index.ts"
import { assertSessionToolPlatform } from "../tools/assertSessionToolPlatform.ts"
import type { Workspace } from "../workspace/Workspace.ts"
import type { Session, SessionId } from "./Session.ts"
import { unwrap } from "@windbell/std.ts/result"

export type LoadSessionOptions = {
  database: Database
  workspace: Workspace
  sessionId: SessionId
}

export async function loadSession(
  options: LoadSessionOptions,
): Promise<Session> {
  const session = unwrap(await options.database.sessions.get(options.sessionId))

  if (session === undefined) {
    throw new Error(`session not found: ${options.sessionId}`)
  }

  if (session.workspaceId !== options.workspace.id) {
    throw new Error(
      `session workspace mismatch: ${options.sessionId} belongs to ${session.workspaceId}`,
    )
  }

  assertSessionToolPlatform(session.context)

  return session
}

export async function loadSessionWorkspace(options: {
  database: Database
  sessionId: SessionId
}): Promise<Workspace> {
  const session = unwrap(await options.database.sessions.get(options.sessionId))

  if (session === undefined) {
    throw new Error(`session not found: ${options.sessionId}`)
  }

  const workspace = unwrap(
    await options.database.workspaces.get(session.workspaceId),
  )

  if (workspace === undefined) {
    throw new Error(`workspace not found: ${session.workspaceId}`)
  }

  return workspace
}

export type CreateSessionOptions = {
  database: Database
  workspace: Workspace
  title: string
  initialSigns: Array<Sign>
}

export async function createSession(
  options: CreateSessionOptions,
): Promise<Session> {
  const session = unwrap(
    await options.database.sessions.make({
      workspaceId: options.workspace.id,
      title: options.title,
    }),
  )

  session.context = [...options.initialSigns]
  unwrap(await options.database.sessions.put(session))
  return session
}

export type GetOrMakeSessionOptions = {
  database: Database
  sessionId?: SessionId
  workspace: Workspace
  title: string
  initialSigns: Array<Sign>
}

export async function getOrMakeSession(
  options: GetOrMakeSessionOptions,
): Promise<Session> {
  if (options.sessionId !== undefined) {
    return await loadSession({
      database: options.database,
      workspace: options.workspace,
      sessionId: options.sessionId,
    })
  }

  return await createSession({
    database: options.database,
    workspace: options.workspace,
    title: options.title,
    initialSigns: options.initialSigns,
  })
}
