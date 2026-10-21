import type { Path } from "@windbell/std.ts/path"
import { err, isError, ok, type Result } from "@windbell/std.ts/result"

import type { Session, SessionId, SessionIndex } from "../session/Session.ts"
import type { Sign } from "../sign/index.ts"
import type { Turn, TurnId, TurnStep } from "../turn/index.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"
import type { FileStore } from "./FileStore.ts"
import { isValidId, makeId, validateId } from "./id.ts"
import {
  formatSignFileName,
  parseSign,
  parseSignFileName,
  serializeSign,
} from "./signFile.ts"

export type SessionStoreOptions = {
  files: FileStore
  path: Path
  root: string
  onSessionUpdated?: (session: SessionIndex) => Promise<void> | void
}

export type MakeSessionOptions = {
  workspaceId: WorkspaceId
  title: string
}

export type ListSessionOptions = {
  workspaceId: WorkspaceId | undefined
}

export type SessionListCursor = {
  updatedAt: number
  id: SessionId
}

export type ListSessionPageOptions = {
  workspaceId: WorkspaceId | undefined
  limit: number
  cursor?: SessionListCursor
}

export type SessionPage = {
  indexes: Array<SessionIndex>
  nextCursor: SessionListCursor | null
}

export type SessionStore = {
  make(options: MakeSessionOptions): Promise<Result<Session, DatabaseError>>
  get(id: SessionId): Promise<Result<Session | undefined, DatabaseError>>
  list(
    options: ListSessionOptions,
  ): Promise<Result<Array<SessionIndex>, DatabaseError>>
  listPage(
    options: ListSessionPageOptions,
  ): Promise<Result<SessionPage, DatabaseError>>
  put(session: Session): Promise<Result<void, DatabaseError>>
  appendSign(id: SessionId, sign: Sign): Promise<Result<number, DatabaseError>>
  nextSignSequence(id: SessionId): Promise<Result<number, DatabaseError>>
  sliceContextBySequence(
    id: SessionId,
    startSequence: number,
    endSequence: number,
  ): Promise<Result<Array<Sign>, DatabaseError>>
  getContextTail(
    id: SessionId,
    limit: number,
  ): Promise<Result<Array<Sign>, DatabaseError>>
  getTurn(
    sessionId: SessionId,
    turnId: TurnId,
  ): Promise<Result<Turn | undefined, DatabaseError>>
  putTurn(turn: Turn): Promise<Result<void, DatabaseError>>
  listTurns(sessionId: SessionId): Promise<Result<Array<Turn>, DatabaseError>>
  putStep(step: TurnStep): Promise<Result<void, DatabaseError>>
  listSteps(
    sessionId: SessionId,
    turnId: TurnId,
  ): Promise<Result<Array<TurnStep>, DatabaseError>>
  nextStepSequence(
    sessionId: SessionId,
    turnId: TurnId,
  ): Promise<Result<number, DatabaseError>>
  updateTitle(
    id: SessionId,
    title: string,
  ): Promise<Result<void, DatabaseError>>
  remove(id: SessionId): Promise<Result<void, DatabaseError>>
}

function compareSessionIndexesDesc(a: SessionIndex, b: SessionIndex): number {
  if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt
  if (a.id === b.id) return 0
  return a.id < b.id ? 1 : -1
}

export function makeSessionStore(options: SessionStoreOptions): SessionStore {
  const paths = options.path
  const root = paths.normalize(options.root)
  const onSessionUpdated = options.onSessionUpdated

  const sessionDir = (id: SessionId): string => {
    return paths.join(root, id)
  }

  const contextDir = (id: SessionId): string => {
    return paths.join(sessionDir(id), "context")
  }

  const turnsDir = (id: SessionId): string => {
    return paths.join(sessionDir(id), "turns")
  }

  const indexPath = (id: SessionId): string => {
    return paths.join(sessionDir(id), "index.json")
  }

  const turnDir = (sessionId: SessionId, turnId: TurnId): string => {
    return paths.join(turnsDir(sessionId), turnId)
  }

  const turnJsonPath = (sessionId: SessionId, turnId: TurnId): string => {
    return paths.join(turnDir(sessionId, turnId), "turn.json")
  }

  const stepsDir = (sessionId: SessionId, turnId: TurnId): string => {
    return paths.join(turnDir(sessionId, turnId), "steps")
  }

  const stepFileName = (sequenceNumber: number): string => {
    return `${String(sequenceNumber).padStart(8, "0")}.json`
  }

  const stepPath = (
    sessionId: SessionId,
    turnId: TurnId,
    sequenceNumber: number,
  ): string => {
    return paths.join(stepsDir(sessionId, turnId), stepFileName(sequenceNumber))
  }

  const parseStepSequenceNumber = (fileName: string): number | undefined => {
    const match = /^(\d+)\.json$/.exec(fileName)
    if (match === null) return undefined

    return Number(match[1])
  }

  const readIndex = async (
    id: SessionId,
  ): Promise<Result<SessionIndex | undefined, DatabaseError>> => {
    const idResult = validateId(id)
    if (isError(idResult)) return idResult

    const valueResult = await options.files.readJsonFile(indexPath(id))
    if (isError(valueResult)) return valueResult
    if (valueResult.value === undefined) return ok(undefined)

    return ok(valueResult.value as SessionIndex)
  }

  const readContextEntries = async (
    id: SessionId,
  ): Promise<
    Result<Array<{ sequence: number; sign: Sign }>, DatabaseError>
  > => {
    const directory = contextDir(id)
    const fileNamesResult = await options.files.listFiles(directory)
    if (isError(fileNamesResult)) return fileNamesResult

    const entries: Array<{ sequence: number; sign: Sign }> = []

    for (const fileName of fileNamesResult.value) {
      const info = parseSignFileName(fileName)
      if (info === undefined) continue

      const textResult = await options.files.readTextFile(
        paths.join(directory, fileName),
      )
      if (isError(textResult)) return textResult
      if (textResult.value === undefined) continue

      entries.push({
        sequence: info.sequence,
        sign: parseSign(fileName, textResult.value),
      })
    }

    entries.sort((a, b) => a.sequence - b.sequence)
    return ok(entries)
  }

  const readContext = async (
    id: SessionId,
  ): Promise<Result<Array<Sign>, DatabaseError>> => {
    const entriesResult = await readContextEntries(id)
    if (isError(entriesResult)) return entriesResult
    return ok(entriesResult.value.map((entry) => entry.sign))
  }

  const readContextTail = async (
    id: SessionId,
    limit: number,
  ): Promise<Result<Array<Sign>, DatabaseError>> => {
    const idResult = validateId(id)
    if (isError(idResult)) return idResult

    const fileNamesResult = await options.files.listFiles(contextDir(id))
    if (isError(fileNamesResult)) return fileNamesResult

    const entries: Array<{ fileName: string; sequence: number }> = []

    for (const fileName of fileNamesResult.value) {
      const info = parseSignFileName(fileName)
      if (info === undefined) continue

      entries.push({ fileName, sequence: info.sequence })
    }

    entries.sort((a, b) => a.sequence - b.sequence)

    if (limit <= 0) return ok([])

    const signs: Array<Sign> = []

    for (const entry of entries.slice(-limit)) {
      const textResult = await options.files.readTextFile(
        paths.join(contextDir(id), entry.fileName),
      )
      if (isError(textResult)) return textResult
      if (textResult.value === undefined) continue

      signs.push(parseSign(entry.fileName, textResult.value))
    }

    return ok(signs)
  }

  const nextSignSequenceInternal = async (
    id: SessionId,
  ): Promise<Result<number, DatabaseError>> => {
    const fileNamesResult = await options.files.listFiles(contextDir(id))
    if (isError(fileNamesResult)) return fileNamesResult

    let maxSequence = -1

    for (const fileName of fileNamesResult.value) {
      const info = parseSignFileName(fileName)
      if (info !== undefined && info.sequence > maxSequence) {
        maxSequence = info.sequence
      }
    }

    return ok(maxSequence + 1)
  }

  const store: SessionStore = {
    async make(makeOptions) {
      const now = Date.now()
      const session: Session = {
        id: makeId("session"),
        workspaceId: makeOptions.workspaceId,
        title: makeOptions.title,
        context: [],
        createdAt: now,
        updatedAt: now,
      }

      const putResult = await store.put(session)
      if (isError(putResult)) return putResult
      return ok(session)
    },

    async get(id) {
      const indexResult = await readIndex(id)
      if (isError(indexResult)) return indexResult
      if (indexResult.value === undefined) return ok(undefined)

      const contextResult = await readContext(id)
      if (isError(contextResult)) return contextResult

      const index = indexResult.value
      return ok({
        id: index.id,
        workspaceId: index.workspaceId,
        title: index.title,
        context: contextResult.value,
        createdAt: index.createdAt,
        updatedAt: index.updatedAt,
      })
    },

    async list(listOptions) {
      const idsResult = await options.files.listDirectories(root)
      if (isError(idsResult)) return idsResult

      const indexes: Array<SessionIndex> = []

      for (const id of idsResult.value) {
        if (!isValidId(id)) continue

        const indexResult = await readIndex(id)
        if (isError(indexResult)) return indexResult
        const index = indexResult.value
        if (index === undefined) continue

        if (
          listOptions.workspaceId !== undefined &&
          index.workspaceId !== listOptions.workspaceId
        ) {
          continue
        }

        indexes.push(index)
      }

      indexes.sort(compareSessionIndexesDesc)
      return ok(indexes)
    },

    async listPage(listOptions) {
      const indexesResult = await store.list({
        workspaceId: listOptions.workspaceId,
      })
      if (isError(indexesResult)) return indexesResult

      let indexes = indexesResult.value

      if (listOptions.cursor !== undefined) {
        const cursor = listOptions.cursor
        indexes = indexes.filter(
          (index) =>
            index.updatedAt < cursor.updatedAt ||
            (index.updatedAt === cursor.updatedAt && index.id < cursor.id),
        )
      }

      const pageIndexes = indexes.slice(0, listOptions.limit)
      const lastIndex = pageIndexes.at(-1)

      return ok({
        indexes: pageIndexes,
        nextCursor:
          indexes.length > listOptions.limit && lastIndex !== undefined
            ? {
                updatedAt: lastIndex.updatedAt,
                id: lastIndex.id,
              }
            : null,
      })
    },

    async put(session) {
      const idResult = validateId(session.id)
      if (isError(idResult)) return idResult

      const removeContextResult = await options.files.remove(
        contextDir(session.id),
      )
      if (isError(removeContextResult)) return removeContextResult

      const removeTurnsResult = await options.files.remove(turnsDir(session.id))
      if (isError(removeTurnsResult)) return removeTurnsResult

      const ensureResult = await options.files.ensureDir(contextDir(session.id))
      if (isError(ensureResult)) return ensureResult

      const index: SessionIndex = {
        id: session.id,
        workspaceId: session.workspaceId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }

      const writeIndexResult = await options.files.writeJsonFile(
        indexPath(session.id),
        index,
      )
      if (isError(writeIndexResult)) return writeIndexResult

      for (const [sequence, sign] of session.context.entries()) {
        const fileName = formatSignFileName(sequence, sign)
        const writeSignResult = await options.files.writeTextFile(
          paths.join(contextDir(session.id), fileName),
          serializeSign(sign),
        )
        if (isError(writeSignResult)) return writeSignResult
      }

      await onSessionUpdated?.(index)
      return ok(undefined)
    },

    async appendSign(id, sign) {
      const indexResult = await readIndex(id)
      if (isError(indexResult)) return indexResult
      if (indexResult.value === undefined) {
        return err(
          makeDatabaseError({
            type: "session-not-found",
            message: `session not found: ${id}`,
            info: { sessionId: id },
          }),
        )
      }

      const sequenceResult = await nextSignSequenceInternal(id)
      if (isError(sequenceResult)) return sequenceResult
      const sequence = sequenceResult.value

      const fileName = formatSignFileName(sequence, sign)
      const writeSignResult = await options.files.writeTextFile(
        paths.join(contextDir(id), fileName),
        serializeSign(sign),
      )
      if (isError(writeSignResult)) return writeSignResult

      const updatedIndex: SessionIndex = {
        ...indexResult.value,
        updatedAt: Date.now(),
      }

      const writeIndexResult = await options.files.writeJsonFile(
        indexPath(id),
        updatedIndex,
      )
      if (isError(writeIndexResult)) return writeIndexResult

      await onSessionUpdated?.(updatedIndex)
      return ok(sequence)
    },

    async nextSignSequence(id) {
      return await nextSignSequenceInternal(id)
    },

    async sliceContextBySequence(id, startSequence, endSequence) {
      const entriesResult = await readContextEntries(id)
      if (isError(entriesResult)) return entriesResult

      return ok(
        entriesResult.value
          .filter(
            (entry) =>
              entry.sequence >= startSequence && entry.sequence < endSequence,
          )
          .map((entry) => entry.sign),
      )
    },

    async getContextTail(id, limit) {
      return await readContextTail(id, limit)
    },

    async getTurn(sessionId, turnId) {
      const sessionIdResult = validateId(sessionId)
      if (isError(sessionIdResult)) return sessionIdResult

      const turnIdResult = validateId(turnId)
      if (isError(turnIdResult)) return turnIdResult

      const valueResult = await options.files.readJsonFile(
        turnJsonPath(sessionId, turnId),
      )
      if (isError(valueResult)) return valueResult
      if (valueResult.value === undefined) return ok(undefined)

      return ok(valueResult.value as Turn)
    },

    async putTurn(turn) {
      const sessionIdResult = validateId(turn.sessionId)
      if (isError(sessionIdResult)) return sessionIdResult

      const turnIdResult = validateId(turn.id)
      if (isError(turnIdResult)) return turnIdResult

      return await options.files.writeJsonFile(
        turnJsonPath(turn.sessionId, turn.id),
        turn,
      )
    },

    async listTurns(sessionId) {
      const sessionIdResult = validateId(sessionId)
      if (isError(sessionIdResult)) return sessionIdResult

      const directoryNamesResult = await options.files.listDirectories(
        turnsDir(sessionId),
      )
      if (isError(directoryNamesResult)) return directoryNamesResult

      const turns: Array<Turn> = []

      for (const directoryName of directoryNamesResult.value) {
        const turnIdResult = validateId(directoryName)
        if (isError(turnIdResult)) continue

        const valueResult = await options.files.readJsonFile(
          turnJsonPath(sessionId, directoryName),
        )
        if (isError(valueResult)) return valueResult
        if (valueResult.value === undefined) continue

        turns.push(valueResult.value as Turn)
      }

      turns.sort((a, b) => a.createdAt - b.createdAt)
      return ok(turns)
    },

    async putStep(step) {
      const sessionIdResult = validateId(step.sessionId)
      if (isError(sessionIdResult)) return sessionIdResult

      const turnIdResult = validateId(step.turnId)
      if (isError(turnIdResult)) return turnIdResult

      return await options.files.writeJsonFile(
        stepPath(step.sessionId, step.turnId, step.sequenceNumber),
        step,
      )
    },

    async listSteps(sessionId, turnId) {
      const sessionIdResult = validateId(sessionId)
      if (isError(sessionIdResult)) return sessionIdResult

      const turnIdResult = validateId(turnId)
      if (isError(turnIdResult)) return turnIdResult

      const fileNamesResult = await options.files.listFiles(
        stepsDir(sessionId, turnId),
      )
      if (isError(fileNamesResult)) return fileNamesResult

      const steps: Array<TurnStep> = []

      for (const fileName of fileNamesResult.value) {
        const sequenceNumber = parseStepSequenceNumber(fileName)
        if (sequenceNumber === undefined) continue

        const valueResult = await options.files.readJsonFile(
          stepPath(sessionId, turnId, sequenceNumber),
        )
        if (isError(valueResult)) return valueResult
        if (valueResult.value === undefined) continue

        steps.push(valueResult.value as TurnStep)
      }

      steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      return ok(steps)
    },

    async nextStepSequence(sessionId, turnId) {
      const stepsResult = await store.listSteps(sessionId, turnId)
      if (isError(stepsResult)) return stepsResult

      let sequenceNumber = 0
      for (const step of stepsResult.value) {
        if (step.sequenceNumber > sequenceNumber) {
          sequenceNumber = step.sequenceNumber
        }
      }

      return ok(sequenceNumber + 1)
    },

    async updateTitle(id, title) {
      const indexResult = await readIndex(id)
      if (isError(indexResult)) return indexResult
      if (indexResult.value === undefined) {
        return err(
          makeDatabaseError({
            type: "session-not-found",
            message: `session not found: ${id}`,
            info: { sessionId: id },
          }),
        )
      }

      const updatedIndex: SessionIndex = {
        ...indexResult.value,
        title,
        updatedAt: Date.now(),
      }

      const writeResult = await options.files.writeJsonFile(
        indexPath(id),
        updatedIndex,
      )
      if (isError(writeResult)) return writeResult

      await onSessionUpdated?.(updatedIndex)
      return ok(undefined)
    },

    async remove(id) {
      const idResult = validateId(id)
      if (isError(idResult)) return idResult

      return await options.files.remove(sessionDir(id))
    },
  }

  return store
}
