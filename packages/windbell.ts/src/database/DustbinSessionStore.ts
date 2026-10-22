import type { Path } from "@xieyuheng/std.ts/path"
import { err, isError, ok, type Result } from "@xieyuheng/std.ts/result"

import type {
  DustbinSessionIndex,
  Session,
  SessionId,
  SessionIndex,
} from "../session/Session.ts"
import type { Sign } from "../sign/index.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"
import type { FileStore } from "./FileStore.ts"
import { isValidId, validateId } from "./id.ts"
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
  get(sessionId: SessionId): Promise<Result<Session | undefined, DatabaseError>>
  getContextTail(
    sessionId: SessionId,
    limit: number,
  ): Promise<Result<Array<Sign>, DatabaseError>>
  trash(
    sessionId: SessionId,
    options?: TrashSessionOptions,
  ): Promise<Result<void, DatabaseError>>
  list(
    options: ListDustbinSessionOptions,
  ): Promise<Result<Array<DustbinSessionIndex>, DatabaseError>>
  restore(sessionId: SessionId): Promise<Result<void, DatabaseError>>
  remove(sessionId: SessionId): Promise<Result<void, DatabaseError>>
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
  ): Promise<Result<SessionIndex | undefined, DatabaseError>> => {
    const idResult = validateId(id)
    if (isError(idResult)) return idResult

    const valueResult = await options.files.readJsonFile(sessionIndexPath(id))
    if (isError(valueResult)) return valueResult
    if (valueResult.value === undefined) return ok(undefined)

    return ok(valueResult.value as SessionIndex)
  }

  const readDustbinSessionIndex = async (
    id: SessionId,
  ): Promise<Result<DustbinSessionIndex | undefined, DatabaseError>> => {
    const idResult = validateId(id)
    if (isError(idResult)) return idResult

    const valueResult = await options.files.readJsonFile(
      dustbinSessionIndexPath(id),
    )
    if (isError(valueResult)) return valueResult
    if (valueResult.value === undefined) return ok(undefined)

    return ok(valueResult.value as DustbinSessionIndex)
  }

  return {
    async get(sessionId) {
      return await sessionStore.get(sessionId)
    },

    async getContextTail(sessionId, limit) {
      return await sessionStore.getContextTail(sessionId, limit)
    },

    async trash(sessionId, trashOptions) {
      const idResult = validateId(sessionId)
      if (isError(idResult)) return idResult

      const indexResult = await readSessionIndex(sessionId)
      if (isError(indexResult)) return indexResult
      if (indexResult.value === undefined) {
        return err(
          makeDatabaseError({
            type: "session-not-found",
            message: `session not found: ${sessionId}`,
            info: { sessionId },
          }),
        )
      }

      const target = dustbinSessionDir(sessionId)
      const targetExistsResult = await options.files.exists(target)
      if (isError(targetExistsResult)) return targetExistsResult
      if (targetExistsResult.value) {
        return err(
          makeDatabaseError({
            type: "session-already-in-dustbin",
            message: `session already in dustbin: ${sessionId}`,
            info: { sessionId },
          }),
        )
      }

      const ensureResult = await options.files.ensureDir(dustbinSessionsRoot)
      if (isError(ensureResult)) return ensureResult

      const renameResult = await options.files.rename(
        sessionDir(sessionId),
        target,
      )
      if (isError(renameResult)) return renameResult

      const dustbinIndex: DustbinSessionIndex = {
        ...indexResult.value,
        deletedAt: Date.now(),
        ...(trashOptions?.trashedWithWorkspace === true
          ? { trashedWithWorkspace: true }
          : {}),
      }

      const writeResult = await options.files.writeJsonFile(
        dustbinSessionIndexPath(sessionId),
        dustbinIndex,
      )
      if (isError(writeResult)) {
        await options.files.rename(target, sessionDir(sessionId))
        return writeResult
      }

      return ok(undefined)
    },

    async list(listOptions) {
      const idsResult = await options.files.listDirectories(dustbinSessionsRoot)
      if (isError(idsResult)) return idsResult

      const indexes: Array<DustbinSessionIndex> = []

      for (const id of idsResult.value) {
        if (!isValidId(id)) continue

        const indexResult = await readDustbinSessionIndex(id)
        if (isError(indexResult)) return indexResult
        const index = indexResult.value
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
      return ok(indexes)
    },

    async restore(sessionId) {
      const idResult = validateId(sessionId)
      if (isError(idResult)) return idResult

      const indexResult = await readDustbinSessionIndex(sessionId)
      if (isError(indexResult)) return indexResult
      if (indexResult.value === undefined) {
        return err(
          makeDatabaseError({
            type: "session-not-in-dustbin",
            message: `session not found in dustbin: ${sessionId}`,
            info: { sessionId },
          }),
        )
      }

      const target = sessionDir(sessionId)
      const targetExistsResult = await options.files.exists(target)
      if (isError(targetExistsResult)) return targetExistsResult
      if (targetExistsResult.value) {
        return err(
          makeDatabaseError({
            type: "session-already-in-dustbin",
            message: `session already exists: ${sessionId}`,
            info: { sessionId },
          }),
        )
      }

      const ensureResult = await options.files.ensureDir(sessionsRoot)
      if (isError(ensureResult)) return ensureResult

      const renameResult = await options.files.rename(
        dustbinSessionDir(sessionId),
        target,
      )
      if (isError(renameResult)) return renameResult

      const restoredIndex: SessionIndex = {
        id: indexResult.value.id,
        workspaceId: indexResult.value.workspaceId,
        title: indexResult.value.title,
        createdAt: indexResult.value.createdAt,
        updatedAt: indexResult.value.updatedAt,
      }

      const writeResult = await options.files.writeJsonFile(
        sessionIndexPath(sessionId),
        restoredIndex,
      )
      if (isError(writeResult)) {
        await options.files.rename(target, dustbinSessionDir(sessionId))
        return writeResult
      }

      return ok(undefined)
    },

    async remove(sessionId) {
      const idResult = validateId(sessionId)
      if (isError(idResult)) return idResult

      return await options.files.remove(dustbinSessionDir(sessionId))
    },
  }
}
