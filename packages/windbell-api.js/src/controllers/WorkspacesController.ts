import type * as S from "@windbell/semiosis.js"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type {
  EnsureWorkspace,
  GetWorkspace,
  ListWorkspaces,
  PutWorkspace,
  RemoveWorkspace,
} from "../services/Workspaces.ts"

export type WorkspacesControllerOptions = {
  listWorkspaces: ReturnType<typeof ListWorkspaces>
  ensureWorkspace: ReturnType<typeof EnsureWorkspace>
  getWorkspace: ReturnType<typeof GetWorkspace>
  putWorkspace: ReturnType<typeof PutWorkspace>
  removeWorkspace: ReturnType<typeof RemoveWorkspace>
}

export const GetWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export const EnsureWorkspaceInputSchema = z.object({
  name: z.string(),
  root: z.string(),
})

export const PutWorkspaceInputSchema = z.object({
  workspace: z.custom<S.Workspace>(),
})

export const RemoveWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export function makeWorkspacesController(options: WorkspacesControllerOptions) {
  return {
    list: makeAction(z.object({}), () => options.listWorkspaces()),

    ensure: makeAction(EnsureWorkspaceInputSchema, (input) =>
      options.ensureWorkspace(input),
    ),

    get: makeAction(GetWorkspaceInputSchema, (input) =>
      options.getWorkspace(input),
    ),

    put: makeAction(PutWorkspaceInputSchema, (input) =>
      options.putWorkspace(input),
    ),

    remove: makeAction(RemoveWorkspaceInputSchema, (input) =>
      options.removeWorkspace(input),
    ),
  }
}
