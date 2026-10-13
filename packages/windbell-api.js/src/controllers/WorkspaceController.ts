import type * as S from "@windbell/semiosis.js"
import { err, ok } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type WorkspaceControllerOptions = {
  workspaces: S.WorkspaceService
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

export function makeWorkspaceController(options: WorkspaceControllerOptions) {
  return {
    list: makeAction(z.object({}), async () => {
      return ok(await options.workspaces.list())
    }),

    ensure: makeAction(EnsureWorkspaceInputSchema, async (input) => {
      return ok(await options.workspaces.ensure(input))
    }),

    get: makeAction(GetWorkspaceInputSchema, async (input) => {
      const workspace = await options.workspaces.get(input.workspaceId)

      if (workspace === undefined) {
        return err({
          type: "workspace-not-found",
          status: 404,
          message: "workspace not found",
          info: { workspaceId: input.workspaceId },
        })
      }

      return ok(workspace)
    }),

    put: makeAction(PutWorkspaceInputSchema, async (input) => {
      await options.workspaces.put(input.workspace)
      return ok(null)
    }),

    remove: makeAction(RemoveWorkspaceInputSchema, async (input) => {
      await options.workspaces.remove(input.workspaceId)
      return ok(null)
    }),
  }
}
