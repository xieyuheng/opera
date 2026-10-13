import type * as S from "@windbell/semiosis.js"
import { err, ok } from "@windbell/std.js/result"
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
    list: makeAction(ListDustbinSessionsInputSchema, async (input) => {
      return ok(await options.dustbinSessions.list(input))
    }),

    get: makeAction(GetDustbinSessionInputSchema, async (input) => {
      const session = await options.dustbinSessions.get(input.sessionId)

      if (session === undefined) {
        return err({
          type: "dustbin-session-not-found",
          status: 404,
          message: "session not found",
          info: { sessionId: input.sessionId },
        })
      }

      return ok(session)
    }),

    trash: makeAction(TrashDustbinSessionInputSchema, async (input) => {
      await options.dustbinSessions.trash(input.sessionId)
      return ok(null)
    }),

    restore: makeAction(RestoreDustbinSessionInputSchema, async (input) => {
      await options.dustbinSessions.restore(input.sessionId)
      return ok(null)
    }),

    remove: makeAction(RemoveDustbinSessionInputSchema, async (input) => {
      await options.dustbinSessions.remove(input.sessionId)
      return ok(null)
    }),
  }
}
