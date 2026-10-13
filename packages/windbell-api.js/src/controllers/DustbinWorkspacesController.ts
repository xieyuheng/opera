import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type {
  GetDustbinWorkspace,
  ListDustbinWorkspaces,
  RemoveDustbinWorkspace,
  RestoreDustbinWorkspace,
  TrashDustbinWorkspace,
} from "../services/DustbinWorkspaces.ts"

export type DustbinWorkspacesControllerOptions = {
  listDustbinWorkspaces: ReturnType<typeof ListDustbinWorkspaces>
  getDustbinWorkspace: ReturnType<typeof GetDustbinWorkspace>
  trashDustbinWorkspace: ReturnType<typeof TrashDustbinWorkspace>
  restoreDustbinWorkspace: ReturnType<typeof RestoreDustbinWorkspace>
  removeDustbinWorkspace: ReturnType<typeof RemoveDustbinWorkspace>
}

export const GetDustbinWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export const TrashDustbinWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export const RestoreDustbinWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export const RemoveDustbinWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export function makeDustbinWorkspacesController(
  options: DustbinWorkspacesControllerOptions,
) {
  return {
    list: makeAction(z.object({}), () => options.listDustbinWorkspaces()),

    get: makeAction(GetDustbinWorkspaceInputSchema, (input) =>
      options.getDustbinWorkspace(input),
    ),

    trash: makeAction(TrashDustbinWorkspaceInputSchema, (input) =>
      options.trashDustbinWorkspace(input),
    ),

    restore: makeAction(RestoreDustbinWorkspaceInputSchema, (input) =>
      options.restoreDustbinWorkspace(input),
    ),

    remove: makeAction(RemoveDustbinWorkspaceInputSchema, (input) =>
      options.removeDustbinWorkspace(input),
    ),
  }
}
