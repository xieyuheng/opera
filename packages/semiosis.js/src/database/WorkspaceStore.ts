import type { Path } from "@windbell/std.js/path"
import type { Workspace, WorkspaceId } from "../workspace/Workspace.ts"
import type { FileStore } from "./fileStore.ts"
import { assertId, isValidId, makeId } from "./id.ts"

export type WorkspaceStoreOptions = {
  files: FileStore
  path: Path
  root: string
}

export type MakeWorkspaceOptions = {
  name: string
  root: string
}

export type WorkspaceStore = {
  make(options: MakeWorkspaceOptions): Promise<Workspace>
  ensure(options: MakeWorkspaceOptions): Promise<Workspace>
  get(id: WorkspaceId): Promise<Workspace | undefined>
  getByRoot(root: string): Promise<Workspace | undefined>
  list(): Promise<Array<Workspace>>
  put(workspace: Workspace): Promise<void>
  remove(id: WorkspaceId): Promise<void>
}

export function makeWorkspaceStore(
  options: WorkspaceStoreOptions,
): WorkspaceStore {
  const path = options.path
  const root = path.normalize(options.root)

  const indexPath = (id: WorkspaceId): string => {
    return path.join(root, id, "index.json")
  }

  const store: WorkspaceStore = {
    async make(options) {
      const now = Date.now()
      const workspace: Workspace = {
        id: makeId("workspace"),
        name: options.name,
        root: path.normalize(options.root),
        createdAt: now,
        updatedAt: now,
      }

      const existing = await store.getByRoot(workspace.root)
      if (existing !== undefined) {
        throw new Error(
          `[WorkspaceStore] duplicate workspace root: ${workspace.root}`,
        )
      }

      await store.put(workspace)
      return workspace
    },

    async ensure(options) {
      const existing = await store.getByRoot(options.root)
      if (existing !== undefined) return existing

      return await store.make(options)
    },

    async get(id) {
      assertId(id)

      const value = await options.files.readJsonFile(indexPath(id))
      if (value === undefined) return undefined

      return value as Workspace
    },

    async getByRoot(rootPath) {
      const resolved = path.normalize(rootPath)
      const workspaces = await store.list()

      return workspaces.find((workspace) => {
        return path.normalize(workspace.root) === resolved
      })
    },

    async list() {
      const ids = await options.files.listDirectories(root)
      const workspaces: Array<Workspace> = []

      for (const id of ids) {
        if (!isValidId(id)) continue

        const workspace = await store.get(id)
        if (workspace !== undefined) {
          workspaces.push(workspace)
        }
      }

      workspaces.sort(
        (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt,
      )
      return workspaces
    },

    async put(workspace) {
      assertId(workspace.id)
      await options.files.writeJsonFile(indexPath(workspace.id), workspace)
    },

    async remove(id) {
      assertId(id)
      await options.files.remove(path.join(root, id))
    },
  }

  return store
}
