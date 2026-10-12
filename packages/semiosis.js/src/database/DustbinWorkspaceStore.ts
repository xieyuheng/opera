import type { Path } from "@windbell/std.js/path"
import type {
  DustbinWorkspace,
  Workspace,
  WorkspaceId,
} from "../workspace/Workspace.ts"
import type { FileStore } from "./fileStore.ts"
import { assertId, isValidId } from "./id.ts"

export type DustbinWorkspaceStoreOptions = {
  files: FileStore
  path: Path
  workspacesRoot: string
  dustbinWorkspacesRoot: string
}

export type DustbinWorkspaceStore = {
  get(id: WorkspaceId): Promise<DustbinWorkspace | undefined>
  list(): Promise<Array<DustbinWorkspace>>
  trash(id: WorkspaceId): Promise<void>
  restore(id: WorkspaceId): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

export type DustbinWorkspaceErrorCode = "not-found" | "conflict"

export class DustbinWorkspaceError extends Error {
  code: DustbinWorkspaceErrorCode

  constructor(code: DustbinWorkspaceErrorCode, message: string) {
    super(message)
    this.name = "DustbinWorkspaceError"
    this.code = code
  }
}

export function makeDustbinWorkspaceStore(
  options: DustbinWorkspaceStoreOptions,
): DustbinWorkspaceStore {
  const paths = options.path
  const workspacesRoot = paths.normalize(options.workspacesRoot)
  const dustbinWorkspacesRoot = paths.normalize(options.dustbinWorkspacesRoot)

  const workspaceDir = (id: WorkspaceId): string => {
    return paths.join(workspacesRoot, id)
  }

  const dustbinWorkspaceDir = (id: WorkspaceId): string => {
    return paths.join(dustbinWorkspacesRoot, id)
  }

  const workspaceIndexPath = (id: WorkspaceId): string => {
    return paths.join(workspaceDir(id), "index.json")
  }

  const dustbinWorkspaceIndexPath = (id: WorkspaceId): string => {
    return paths.join(dustbinWorkspaceDir(id), "index.json")
  }

  const readWorkspace = async (
    id: WorkspaceId,
  ): Promise<Workspace | undefined> => {
    assertId(id)

    const value = await options.files.readJsonFile(workspaceIndexPath(id))
    if (value === undefined) return undefined

    return value as Workspace
  }

  const readDustbinWorkspace = async (
    id: WorkspaceId,
  ): Promise<DustbinWorkspace | undefined> => {
    assertId(id)

    const value = await options.files.readJsonFile(
      dustbinWorkspaceIndexPath(id),
    )
    if (value === undefined) return undefined

    return value as DustbinWorkspace
  }

  return {
    get: (id) => readDustbinWorkspace(id),

    async list() {
      const ids = await options.files.listDirectories(dustbinWorkspacesRoot)
      const workspaces: Array<DustbinWorkspace> = []

      for (const id of ids) {
        if (!isValidId(id)) continue

        const workspace = await readDustbinWorkspace(id)
        if (workspace === undefined) continue
        if (typeof workspace.deletedAt !== "number") continue

        workspaces.push(workspace)
      }

      workspaces.sort((a, b) => b.deletedAt - a.deletedAt)
      return workspaces
    },

    async trash(id) {
      assertId(id)

      const workspace = await readWorkspace(id)
      if (workspace === undefined) {
        throw new DustbinWorkspaceError(
          "not-found",
          `workspace not found: ${id}`,
        )
      }

      const target = dustbinWorkspaceDir(id)
      if (await options.files.exists(target)) {
        throw new DustbinWorkspaceError(
          "conflict",
          `workspace already in dustbin: ${id}`,
        )
      }

      await options.files.ensureDir(dustbinWorkspacesRoot)
      await options.files.rename(workspaceDir(id), target)

      const dustbinWorkspace: DustbinWorkspace = {
        ...workspace,
        deletedAt: Date.now(),
      }

      try {
        await options.files.writeJsonFile(
          dustbinWorkspaceIndexPath(id),
          dustbinWorkspace,
        )
      } catch (error) {
        await options.files
          .rename(target, workspaceDir(id))
          .catch(() => undefined)
        throw error
      }
    },

    async restore(id) {
      assertId(id)

      const workspace = await readDustbinWorkspace(id)
      if (workspace === undefined) {
        throw new DustbinWorkspaceError(
          "not-found",
          `workspace not found in dustbin: ${id}`,
        )
      }

      const target = workspaceDir(id)
      if (await options.files.exists(target)) {
        throw new DustbinWorkspaceError(
          "conflict",
          `workspace already exists: ${id}`,
        )
      }

      await options.files.ensureDir(workspacesRoot)
      await options.files.rename(dustbinWorkspaceDir(id), target)

      const restoredWorkspace: Workspace = {
        id: workspace.id,
        name: workspace.name,
        root: workspace.root,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      }

      try {
        await options.files.writeJsonFile(
          workspaceIndexPath(id),
          restoredWorkspace,
        )
      } catch (error) {
        await options.files
          .rename(target, dustbinWorkspaceDir(id))
          .catch(() => undefined)
        throw error
      }
    },

    async remove(id) {
      assertId(id)
      await options.files.remove(dustbinWorkspaceDir(id))
    },
  }
}
