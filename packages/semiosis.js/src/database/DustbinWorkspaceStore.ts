import type { Path } from "@windbell/std.js/path"
import { err, isError, ok, type Result } from "@windbell/std.js/result"
import type {
  DustbinWorkspace,
  Workspace,
  WorkspaceId,
} from "../workspace/Workspace.ts"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"
import type { FileStore } from "./FileStore.ts"
import { isValidId, validateId } from "./id.ts"

export type DustbinWorkspaceStoreOptions = {
  files: FileStore
  path: Path
  workspacesRoot: string
  dustbinWorkspacesRoot: string
}

export type DustbinWorkspaceStore = {
  get(
    id: WorkspaceId,
  ): Promise<Result<DustbinWorkspace | undefined, DatabaseError>>
  list(): Promise<Result<Array<DustbinWorkspace>, DatabaseError>>
  trash(id: WorkspaceId): Promise<Result<void, DatabaseError>>
  restore(id: WorkspaceId): Promise<Result<void, DatabaseError>>
  remove(id: WorkspaceId): Promise<Result<void, DatabaseError>>
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
  ): Promise<Result<Workspace | undefined, DatabaseError>> => {
    const idResult = validateId(id)
    if (isError(idResult)) return idResult

    const valueResult = await options.files.readJsonFile(workspaceIndexPath(id))
    if (isError(valueResult)) return valueResult
    if (valueResult.value === undefined) return ok(undefined)

    return ok(valueResult.value as Workspace)
  }

  const readDustbinWorkspace = async (
    id: WorkspaceId,
  ): Promise<Result<DustbinWorkspace | undefined, DatabaseError>> => {
    const idResult = validateId(id)
    if (isError(idResult)) return idResult

    const valueResult = await options.files.readJsonFile(
      dustbinWorkspaceIndexPath(id),
    )
    if (isError(valueResult)) return valueResult
    if (valueResult.value === undefined) return ok(undefined)

    return ok(valueResult.value as DustbinWorkspace)
  }

  return {
    async get(id) {
      return await readDustbinWorkspace(id)
    },

    async list() {
      const idsResult = await options.files.listDirectories(
        dustbinWorkspacesRoot,
      )
      if (isError(idsResult)) return idsResult

      const workspaces: Array<DustbinWorkspace> = []

      for (const id of idsResult.value) {
        if (!isValidId(id)) continue

        const workspaceResult = await readDustbinWorkspace(id)
        if (isError(workspaceResult)) return workspaceResult
        const workspace = workspaceResult.value
        if (workspace === undefined) continue
        if (typeof workspace.deletedAt !== "number") continue

        workspaces.push(workspace)
      }

      workspaces.sort((a, b) => b.deletedAt - a.deletedAt)
      return ok(workspaces)
    },

    async trash(id) {
      const idResult = validateId(id)
      if (isError(idResult)) return idResult

      const workspaceResult = await readWorkspace(id)
      if (isError(workspaceResult)) return workspaceResult
      if (workspaceResult.value === undefined) {
        return err(
          makeDatabaseError({
            type: "workspace-not-found",
            message: `workspace not found: ${id}`,
            info: { workspaceId: id },
          }),
        )
      }

      const target = dustbinWorkspaceDir(id)
      const targetExistsResult = await options.files.exists(target)
      if (isError(targetExistsResult)) return targetExistsResult
      if (targetExistsResult.value) {
        return err(
          makeDatabaseError({
            type: "workspace-already-in-dustbin",
            message: `workspace already in dustbin: ${id}`,
            info: { workspaceId: id },
          }),
        )
      }

      const ensureResult = await options.files.ensureDir(dustbinWorkspacesRoot)
      if (isError(ensureResult)) return ensureResult

      const renameResult = await options.files.rename(workspaceDir(id), target)
      if (isError(renameResult)) return renameResult

      const dustbinWorkspace: DustbinWorkspace = {
        ...workspaceResult.value,
        deletedAt: Date.now(),
      }

      const writeResult = await options.files.writeJsonFile(
        dustbinWorkspaceIndexPath(id),
        dustbinWorkspace,
      )
      if (isError(writeResult)) {
        await options.files.rename(target, workspaceDir(id))
        return writeResult
      }

      return ok(undefined)
    },

    async restore(id) {
      const idResult = validateId(id)
      if (isError(idResult)) return idResult

      const workspaceResult = await readDustbinWorkspace(id)
      if (isError(workspaceResult)) return workspaceResult
      if (workspaceResult.value === undefined) {
        return err(
          makeDatabaseError({
            type: "workspace-not-in-dustbin",
            message: `workspace not found in dustbin: ${id}`,
            info: { workspaceId: id },
          }),
        )
      }

      const target = workspaceDir(id)
      const targetExistsResult = await options.files.exists(target)
      if (isError(targetExistsResult)) return targetExistsResult
      if (targetExistsResult.value) {
        return err(
          makeDatabaseError({
            type: "workspace-already-exists",
            message: `workspace already exists: ${id}`,
            info: { workspaceId: id },
          }),
        )
      }

      const ensureResult = await options.files.ensureDir(workspacesRoot)
      if (isError(ensureResult)) return ensureResult

      const renameResult = await options.files.rename(
        dustbinWorkspaceDir(id),
        target,
      )
      if (isError(renameResult)) return renameResult

      const restoredWorkspace: Workspace = {
        id: workspaceResult.value.id,
        name: workspaceResult.value.name,
        root: workspaceResult.value.root,
        createdAt: workspaceResult.value.createdAt,
        updatedAt: workspaceResult.value.updatedAt,
      }

      const writeResult = await options.files.writeJsonFile(
        workspaceIndexPath(id),
        restoredWorkspace,
      )
      if (isError(writeResult)) {
        await options.files.rename(target, dustbinWorkspaceDir(id))
        return writeResult
      }

      return ok(undefined)
    },

    async remove(id) {
      const idResult = validateId(id)
      if (isError(idResult)) return idResult

      return await options.files.remove(dustbinWorkspaceDir(id))
    },
  }
}
