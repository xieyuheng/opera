import { makeServiceError } from "@windbell/semiosis.js"
import type * as S from "@windbell/semiosis.js"
import { err } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type DustbinSessionControllerOptions = {
  dustbinSessions: S.DustbinSessionService
}

export const ListDustbinSessionsInputSchema = z
  .object({
    workspaceId: z.string().optional(),
  })
  .transform((input) => ({
    workspaceId: input.workspaceId,
  }))

export const GetDustbinSessionInputSchema = z.object({
  sessionId: z.string(),
})

export const TrashDustbinSessionInputSchema = z.object({
  sessionId: z.string(),
})

export const RestoreDustbinSessionInputSchema = z.object({
  sessionId: z.string(),
})

export const RemoveDustbinSessionInputSchema = z.object({
  sessionId: z.string(),
})

export function makeDustbinSessionController(
  options: DustbinSessionControllerOptions,
) {
  return {
    list: makeAction(ListDustbinSessionsInputSchema, (input) =>
      options.dustbinSessions.list(input),
    ),

    get: makeAction(GetDustbinSessionInputSchema, async (input) => {
      const result = await options.dustbinSessions.get(input.sessionId)
      if (result.kind === "ErrorResult") return result
      if (result.value === undefined) {
        return err(
          makeServiceError({
            type: "dustbin-session-not-found",
            message: "session not found",
            info: {
              sessionId: input.sessionId,
            },
          }),
        )
      }

      return result
    }),

    trash: makeAction(TrashDustbinSessionInputSchema, (input) =>
      options.dustbinSessions.trash(input.sessionId),
    ),

    restore: makeAction(RestoreDustbinSessionInputSchema, (input) =>
      options.dustbinSessions.restore(input.sessionId),
    ),

    remove: makeAction(RemoveDustbinSessionInputSchema, (input) =>
      options.dustbinSessions.remove(input.sessionId),
    ),
  }
}
