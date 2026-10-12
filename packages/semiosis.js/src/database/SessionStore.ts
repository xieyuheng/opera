import type { Path } from "@windbell/std.js/path"
import type { Session, SessionId, SessionIndex } from "../session/Session.ts"
import type { Turn, TurnId } from "../turn/index.ts"
import type { Sign } from "../sign/index.ts"
import type { WorkspaceId } from "../workspace/Workspace.ts"
import type { FileStore } from "./FileStore.ts"
import { assertId, isValidId, makeId } from "./id.ts"
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

export type SessionStore = {
  make(options: MakeSessionOptions): Promise<Session>
  get(id: SessionId): Promise<Session | undefined>
  list(options: ListSessionOptions): Promise<Array<SessionIndex>>
  put(session: Session): Promise<void>
  appendSign(id: SessionId, sign: Sign): Promise<number>
  nextSignSequence(id: SessionId): Promise<number>
  sliceContextBySequence(
    id: SessionId,
    startSequence: number,
    endSequence: number,
  ): Promise<Array<Sign>>
  getTurn(sessionId: SessionId, turnId: TurnId): Promise<Turn | undefined>
  putTurn(turn: Turn): Promise<void>
  listTurns(sessionId: SessionId): Promise<Array<Turn>>
  updateTitle(id: SessionId, title: string): Promise<void>
  remove(id: SessionId): Promise<void>
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

  const turnPath = (sessionId: SessionId, turnId: TurnId): string => {
    return paths.join(turnsDir(sessionId), `${turnId}.json`)
  }

  const readIndex = async (
    id: SessionId,
  ): Promise<SessionIndex | undefined> => {
    assertId(id)

    const value = await options.files.readJsonFile(indexPath(id))
    if (value === undefined) return undefined

    return value as SessionIndex
  }

  const readContextEntries = async (
    id: SessionId,
  ): Promise<Array<{ sequence: number; sign: Sign }>> => {
    const directory = contextDir(id)
    const fileNames = await options.files.listFiles(directory)
    const entries: Array<{ sequence: number; sign: Sign }> = []

    for (const fileName of fileNames) {
      const info = parseSignFileName(fileName)
      if (info === undefined) continue

      const text = await options.files.readTextFile(
        paths.join(directory, fileName),
      )
      if (text === undefined) continue

      entries.push({
        sequence: info.sequence,
        sign: parseSign(fileName, text),
      })
    }

    entries.sort((a, b) => a.sequence - b.sequence)
    return entries
  }

  const readContext = async (id: SessionId): Promise<Array<Sign>> => {
    const entries = await readContextEntries(id)
    return entries.map((entry) => entry.sign)
  }

  const nextSignSequence = async (id: SessionId): Promise<number> => {
    const fileNames = await options.files.listFiles(contextDir(id))
    let maxSequence = -1

    for (const fileName of fileNames) {
      const info = parseSignFileName(fileName)
      if (info !== undefined && info.sequence > maxSequence) {
        maxSequence = info.sequence
      }
    }

    return maxSequence + 1
  }

  const store: SessionStore = {
    async make(options) {
      const now = Date.now()
      const session: Session = {
        id: makeId("session"),
        workspaceId: options.workspaceId,
        title: options.title,
        context: [],
        createdAt: now,
        updatedAt: now,
      }

      await store.put(session)
      return session
    },

    async get(id) {
      const index = await readIndex(id)
      if (index === undefined) return undefined

      const context = await readContext(id)

      return {
        id: index.id,
        workspaceId: index.workspaceId,
        title: index.title,
        context,
        createdAt: index.createdAt,
        updatedAt: index.updatedAt,
      }
    },

    async list(listOptions) {
      const ids = await options.files.listDirectories(root)
      const indexes: Array<SessionIndex> = []

      for (const id of ids) {
        if (!isValidId(id)) continue

        const index = await readIndex(id)
        if (index === undefined) continue

        if (
          listOptions.workspaceId !== undefined &&
          index.workspaceId !== listOptions.workspaceId
        ) {
          continue
        }

        indexes.push(index)
      }

      indexes.sort(
        (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt,
      )
      return indexes
    },

    async put(session) {
      assertId(session.id)

      await options.files.remove(contextDir(session.id))
      await options.files.remove(turnsDir(session.id))
      await options.files.ensureDir(contextDir(session.id))

      const index: SessionIndex = {
        id: session.id,
        workspaceId: session.workspaceId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }

      await options.files.writeJsonFile(indexPath(session.id), index)

      for (const [sequence, sign] of session.context.entries()) {
        const fileName = formatSignFileName(sequence, sign)
        await options.files.writeTextFile(
          paths.join(contextDir(session.id), fileName),
          serializeSign(sign),
        )
      }

      await onSessionUpdated?.(index)
    },

    async appendSign(id, sign) {
      const index = await readIndex(id)
      if (index === undefined) {
        throw new Error(`[SessionStore] session not found: ${id}`)
      }

      const sequence = await nextSignSequence(id)
      const fileName = formatSignFileName(sequence, sign)

      await options.files.writeTextFile(
        paths.join(contextDir(id), fileName),
        serializeSign(sign),
      )

      const updatedIndex: SessionIndex = {
        ...index,
        updatedAt: Date.now(),
      }

      await options.files.writeJsonFile(indexPath(id), updatedIndex)
      await onSessionUpdated?.(updatedIndex)

      return sequence
    },

    nextSignSequence,

    async sliceContextBySequence(id, startSequence, endSequence) {
      const entries = await readContextEntries(id)

      return entries
        .filter(
          (entry) =>
            entry.sequence >= startSequence && entry.sequence < endSequence,
        )
        .map((entry) => entry.sign)
    },

    async getTurn(sessionId, turnId) {
      assertId(sessionId)
      assertId(turnId)

      const value = await options.files.readJsonFile(
        turnPath(sessionId, turnId),
      )
      if (value === undefined) return undefined

      return value as Turn
    },

    async putTurn(turn) {
      assertId(turn.sessionId)
      assertId(turn.id)

      await options.files.writeJsonFile(turnPath(turn.sessionId, turn.id), turn)
    },

    async listTurns(sessionId) {
      assertId(sessionId)

      const fileNames = await options.files.listFiles(turnsDir(sessionId))
      const turns: Array<Turn> = []

      for (const fileName of fileNames) {
        if (!fileName.endsWith(".json")) continue

        const value = await options.files.readJsonFile(
          paths.join(turnsDir(sessionId), fileName),
        )
        if (value === undefined) continue

        turns.push(value as Turn)
      }

      turns.sort((a, b) => a.createdAt - b.createdAt)
      return turns
    },

    async updateTitle(id, title) {
      const index = await readIndex(id)
      if (index === undefined) {
        throw new Error(`[SessionStore] session not found: ${id}`)
      }

      const updatedIndex: SessionIndex = {
        ...index,
        title,
        updatedAt: Date.now(),
      }

      await options.files.writeJsonFile(indexPath(id), updatedIndex)
      await onSessionUpdated?.(updatedIndex)
    },

    async remove(id) {
      assertId(id)
      await options.files.remove(sessionDir(id))
    },
  }

  return store
}
