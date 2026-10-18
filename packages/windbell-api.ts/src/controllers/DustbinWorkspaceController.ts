import { makeServiceError } from "@windbell/semiosis.ts"
import type * as S from "@windbell/semiosis.ts"
import { err } from "@windbell/std.ts/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type DustbinWorkspaceControllerOptions = {
  dustbinWorkspaces: S.DustbinWorkspaceService
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

export function makeDustbinWorkspaceController(
  options: DustbinWorkspaceControllerOptions,
) {
  return {
    list: makeAction(z.object({}), () => options.dustbinWorkspaces.list()),

    get: makeAction(GetDustbinWorkspaceInputSchema, async (input) => {
      const result = await options.dustbinWorkspaces.get(input.workspaceId)
      if (result.kind === "ErrorResult") return result
      if (result.value === undefined) {
        return err(
          makeServiceError({
            type: "dustbin-workspace-not-found",
            message: "workspace not found",
            info: {
              workspaceId: input.workspaceId,
            },
          }),
        )
      }

      return result
    }),

    trash: makeAction(TrashDustbinWorkspaceInputSchema, (input) =>
      options.dustbinWorkspaces.trash(input.workspaceId),
    ),

    restore: makeAction(RestoreDustbinWorkspaceInputSchema, (input) =>
      options.dustbinWorkspaces.restore(input.workspaceId),
    ),

    remove: makeAction(RemoveDustbinWorkspaceInputSchema, (input) =>
      options.dustbinWorkspaces.remove(input.workspaceId),
    ),
  }
}
