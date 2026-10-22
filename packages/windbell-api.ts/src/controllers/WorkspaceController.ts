import { err } from "@xieyuheng/std.ts/result"
import { makeServiceError } from "@xieyuheng/windbell.ts"
import type * as W from "@xieyuheng/windbell.ts"
import { z } from "zod"

import { makeAction } from "../http/makeAction.ts"

export type WorkspaceControllerOptions = {
  workspaces: W.WorkspaceService
}

export const GetWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export const EnsureWorkspaceInputSchema = z.object({
  name: z.string(),
  root: z.string(),
})

export const PutWorkspaceInputSchema = z.object({
  workspace: z.custom<W.Workspace>(),
})

export const RemoveWorkspaceInputSchema = z.object({
  workspaceId: z.string(),
})

export function makeWorkspaceController(options: WorkspaceControllerOptions) {
  return {
    list: makeAction(z.object({}), () => options.workspaces.list()),

    ensure: makeAction(EnsureWorkspaceInputSchema, (input) =>
      options.workspaces.ensure(input),
    ),

    get: makeAction(GetWorkspaceInputSchema, async (input) => {
      const result = await options.workspaces.get(input.workspaceId)
      if (result.kind === "ErrorResult") return result
      if (result.value === undefined) {
        return err(
          makeServiceError({
            type: "workspace-not-found",
            message: "workspace not found",
            info: {
              workspaceId: input.workspaceId,
            },
          }),
        )
      }

      return result
    }),

    put: makeAction(PutWorkspaceInputSchema, (input) =>
      options.workspaces.put(input.workspace),
    ),

    remove: makeAction(RemoveWorkspaceInputSchema, (input) =>
      options.workspaces.remove(input.workspaceId),
    ),
  }
}
