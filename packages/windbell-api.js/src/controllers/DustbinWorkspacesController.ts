import type * as S from "@windbell/semiosis.js"
import { err, ok } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type DustbinWorkspacesControllerOptions = {
  dustbinWorkspaces: S.DustbinWorkspacesService
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
    list: makeAction(z.object({}), async () => {
      return ok(await options.dustbinWorkspaces.list())
    }),

    get: makeAction(GetDustbinWorkspaceInputSchema, async (input) => {
      const workspace = await options.dustbinWorkspaces.get(input.workspaceId)

      if (workspace === undefined) {
        return err({
          type: "dustbin-workspace-not-found",
          status: 404,
          message: "workspace not found",
          info: { workspaceId: input.workspaceId },
        })
      }

      return ok(workspace)
    }),

    trash: makeAction(TrashDustbinWorkspaceInputSchema, async (input) => {
      await options.dustbinWorkspaces.trash(input.workspaceId)
      return ok(null)
    }),

    restore: makeAction(RestoreDustbinWorkspaceInputSchema, async (input) => {
      await options.dustbinWorkspaces.restore(input.workspaceId)
      return ok(null)
    }),

    remove: makeAction(RemoveDustbinWorkspaceInputSchema, async (input) => {
      await options.dustbinWorkspaces.remove(input.workspaceId)
      return ok(null)
    }),
  }
}
