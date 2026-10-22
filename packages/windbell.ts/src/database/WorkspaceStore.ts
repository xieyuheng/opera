import type { Path } from "@xieyuheng/std.ts/path"
import { err, isError, ok, type Result } from "@xieyuheng/std.ts/result"

import type { Workspace, WorkspaceId } from "../workspace/Workspace.ts"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"
import type { FileStore } from "./FileStore.ts"
import { isValidId, makeId, validateId } from "./id.ts"

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
  make(options: MakeWorkspaceOptions): Promise<Result<Workspace, DatabaseError>>
  ensure(
    options: MakeWorkspaceOptions,
  ): Promise<Result<Workspace, DatabaseError>>
  get(id: WorkspaceId): Promise<Result<Workspace | undefined, DatabaseError>>
  getByRoot(root: string): Promise<Result<Workspace | undefined, DatabaseError>>
  list(): Promise<Result<Array<Workspace>, DatabaseError>>
  put(workspace: Workspace): Promise<Result<void, DatabaseError>>
  remove(id: WorkspaceId): Promise<Result<void, DatabaseError>>
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
    async make(makeOptions) {
      const now = Date.now()
      const workspace: Workspace = {
        id: makeId("workspace"),
        name: makeOptions.name,
        root: path.normalize(makeOptions.root),
        createdAt: now,
        updatedAt: now,
      }

      const existingResult = await store.getByRoot(workspace.root)
      if (isError(existingResult)) return existingResult
      if (existingResult.value !== undefined) {
        return err(
          makeDatabaseError({
            type: "workspace-root-already-exists",
            message: `workspace root already exists: ${workspace.root}`,
            info: { root: workspace.root },
          }),
        )
      }

      const putResult = await store.put(workspace)
      if (isError(putResult)) return putResult
      return ok(workspace)
    },

    async ensure(ensureOptions) {
      const existingResult = await store.getByRoot(ensureOptions.root)
      if (isError(existingResult)) return existingResult
      if (existingResult.value !== undefined) return ok(existingResult.value)

      return await store.make(ensureOptions)
    },

    async get(id) {
      const idResult = validateId(id)
      if (isError(idResult)) return idResult

      const valueResult = await options.files.readJsonFile(indexPath(id))
      if (isError(valueResult)) return valueResult
      if (valueResult.value === undefined) return ok(undefined)

      return ok(valueResult.value as Workspace)
    },

    async getByRoot(rootPath) {
      const listResult = await store.list()
      if (isError(listResult)) return listResult

      const resolved = path.normalize(rootPath)
      return ok(
        listResult.value.find((workspace) => {
          return path.normalize(workspace.root) === resolved
        }),
      )
    },

    async list() {
      const idsResult = await options.files.listDirectories(root)
      if (isError(idsResult)) return idsResult

      const workspaces: Array<Workspace> = []

      for (const id of idsResult.value) {
        if (!isValidId(id)) continue

        const workspaceResult = await store.get(id)
        if (isError(workspaceResult)) return workspaceResult

        if (workspaceResult.value !== undefined) {
          workspaces.push(workspaceResult.value)
        }
      }

      workspaces.sort(
        (a, b) => b.updatedAt - a.updatedAt || b.createdAt - a.createdAt,
      )
      return ok(workspaces)
    },

    async put(workspace) {
      const idResult = validateId(workspace.id)
      if (isError(idResult)) return idResult

      return await options.files.writeJsonFile(
        indexPath(workspace.id),
        workspace,
      )
    },

    async remove(id) {
      const idResult = validateId(id)
      if (isError(idResult)) return idResult

      return await options.files.remove(path.join(root, id))
    },
  }

  return store
}
