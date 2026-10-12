import type { Path } from "@windbell/std.js/path"
import type {
  DustbinSessionIndex,
  Session,
  SessionId,
  SessionIndex,
} from "../session/Session.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"
import type { FileStore } from "./fileStore.ts"
import { assertId, isValidId } from "./id.ts"
import { makeSessionStore } from "./SessionStore.ts"

export type DustbinSessionStoreOptions = {
  files: FileStore
  path: Path
  sessionsRoot: string
  dustbinSessionsRoot: string
}

export type ListDustbinSessionOptions = {
  workspaceId: WorkspaceId | undefined
}

export type TrashSessionOptions = {
  trashedWithWorkspace?: boolean
}

export type DustbinSessionStore = {
  get(sessionId: SessionId): Promise<Session | undefined>
  trash(sessionId: SessionId, options?: TrashSessionOptions): Promise<void>
  list(options: ListDustbinSessionOptions): Promise<Array<DustbinSessionIndex>>
  restore(sessionId: SessionId): Promise<void>
  remove(sessionId: SessionId): Promise<void>
}

export type DustbinSessionErrorCode = "not-found" | "conflict"

export class DustbinSessionError extends Error {
  code: DustbinSessionErrorCode

  constructor(code: DustbinSessionErrorCode, message: string) {
    super(message)
    this.name = "DustbinSessionError"
    this.code = code
  }
}

export function makeDustbinSessionStore(
  options: DustbinSessionStoreOptions,
): DustbinSessionStore {
  const paths = options.path
  const sessionsRoot = paths.normalize(options.sessionsRoot)
  const dustbinSessionsRoot = paths.normalize(options.dustbinSessionsRoot)
  const sessionStore = makeSessionStore({
    files: options.files,
    path: options.path,
    root: dustbinSessionsRoot,
  })

  const sessionDir = (id: SessionId): string => {
    return paths.join(sessionsRoot, id)
  }

  const dustbinSessionDir = (id: SessionId): string => {
    return paths.join(dustbinSessionsRoot, id)
  }

  const sessionIndexPath = (id: SessionId): string => {
    return paths.join(sessionDir(id), "index.json")
  }

  const dustbinSessionIndexPath = (id: SessionId): string => {
    return paths.join(dustbinSessionDir(id), "index.json")
  }

  const readSessionIndex = async (
    id: SessionId,
  ): Promise<SessionIndex | undefined> => {
    assertId(id)

    const value = await options.files.readJsonFile(sessionIndexPath(id))
    if (value === undefined) return undefined

    return value as SessionIndex
  }

  const readDustbinSessionIndex = async (
    id: SessionId,
  ): Promise<DustbinSessionIndex | undefined> => {
    assertId(id)

    const value = await options.files.readJsonFile(dustbinSessionIndexPath(id))
    if (value === undefined) return undefined

    return value as DustbinSessionIndex
  }

  return {
    get: (sessionId) => sessionStore.get(sessionId),

    async trash(sessionId, trashOptions) {
      assertId(sessionId)

      const index = await readSessionIndex(sessionId)
      if (index === undefined) {
        throw new DustbinSessionError(
          "not-found",
          `session not found: ${sessionId}`,
        )
      }

      const target = dustbinSessionDir(sessionId)
      if (await options.files.exists(target)) {
        throw new DustbinSessionError(
          "conflict",
          `session already in dustbin: ${sessionId}`,
        )
      }

      await options.files.ensureDir(dustbinSessionsRoot)
      await options.files.rename(sessionDir(sessionId), target)

      const dustbinIndex: DustbinSessionIndex = {
        ...index,
        deletedAt: Date.now(),
        ...(trashOptions?.trashedWithWorkspace === true
          ? { trashedWithWorkspace: true }
          : {}),
      }

      try {
        await options.files.writeJsonFile(
          dustbinSessionIndexPath(sessionId),
          dustbinIndex,
        )
      } catch (error) {
        await options.files
          .rename(target, sessionDir(sessionId))
          .catch(() => undefined)
        throw error
      }
    },

    async list(listOptions) {
      const ids = await options.files.listDirectories(dustbinSessionsRoot)
      const indexes: Array<DustbinSessionIndex> = []

      for (const id of ids) {
        if (!isValidId(id)) continue

        const index = await readDustbinSessionIndex(id)
        if (index === undefined) continue

        if (typeof index.deletedAt !== "number") continue

        if (
          listOptions.workspaceId !== undefined &&
          index.workspaceId !== listOptions.workspaceId
        ) {
          continue
        }

        indexes.push(index)
      }

      indexes.sort((a, b) => b.deletedAt - a.deletedAt)
      return indexes
    },

    async restore(sessionId) {
      assertId(sessionId)

      const index = await readDustbinSessionIndex(sessionId)
      if (index === undefined) {
        throw new DustbinSessionError(
          "not-found",
          `session not found in dustbin: ${sessionId}`,
        )
      }

      const target = sessionDir(sessionId)
      if (await options.files.exists(target)) {
        throw new DustbinSessionError(
          "conflict",
          `session already exists: ${sessionId}`,
        )
      }

      await options.files.ensureDir(sessionsRoot)
      await options.files.rename(dustbinSessionDir(sessionId), target)

      const restoredIndex: SessionIndex = {
        id: index.id,
        workspaceId: index.workspaceId,
        title: index.title,
        createdAt: index.createdAt,
        updatedAt: index.updatedAt,
      }

      try {
        await options.files.writeJsonFile(
          sessionIndexPath(sessionId),
          restoredIndex,
        )
      } catch (error) {
        await options.files
          .rename(target, dustbinSessionDir(sessionId))
          .catch(() => undefined)
        throw error
      }
    },

    async remove(sessionId) {
      assertId(sessionId)
      await options.files.remove(dustbinSessionDir(sessionId))
    },
  }
}
