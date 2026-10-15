import { makeServiceError } from "@windbell/semiosis.js"
import type * as S from "@windbell/semiosis.js"
import { err, ok } from "@windbell/std.js/result"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type SessionControllerOptions = {
  sessions: S.SessionService
}

export const ListSessionsInputSchema = z
  .object({
    workspaceId: z.string().optional(),
  })
  .transform((input) => ({
    workspaceId: input.workspaceId,
  }))

export const MakeSessionInputSchema = z.object({
  workspaceId: z.string(),
  title: z.string(),
})

export const GetSessionInputSchema = z.object({
  sessionId: z.string(),
})

export const PutSessionInputSchema = z.object({
  sessionId: z.string(),
  session: z.custom<S.Session>(),
})

export const RemoveSessionInputSchema = z.object({
  sessionId: z.string(),
})

export const GenerateSessionTitleInputSchema = z.object({
  sessionId: z.string(),
  model: z.object({
    providerName: z.string(),
    name: z.string(),
  }),
})

export function makeSessionController(options: SessionControllerOptions) {
  return {
    list: makeAction(ListSessionsInputSchema, (input) =>
      options.sessions.list(input),
    ),

    make: makeAction(
      MakeSessionInputSchema,
      (input) => options.sessions.make(input),
      { status: 201 },
    ),

    get: makeAction(GetSessionInputSchema, async (input) => {
      const result = await options.sessions.get(input.sessionId)
      if (result.kind === "ErrorResult") return result
      if (result.value === undefined) {
        return err(
          makeServiceError({
            type: "session-not-found",
            message: "session not found",
            info: {
              sessionId: input.sessionId,
            },
          }),
        )
      }

      return result
    }),

    put: makeAction(PutSessionInputSchema, async (input) => {
      if (input.session.id !== input.sessionId) {
        return err(
          makeServiceError({
            type: "session-id-mismatch",
            message: "session id mismatch",
          }),
        )
      }

      return await options.sessions.put(input.session)
    }),

    getTotalUsage: makeAction(GetSessionInputSchema, (input) =>
      options.sessions.getTotalUsage(input),
    ),

    remove: makeAction(RemoveSessionInputSchema, (input) =>
      options.sessions.remove(input.sessionId),
    ),

    generateTitle: makeAction(
      GenerateSessionTitleInputSchema,
      async (input) => {
        const result = await options.sessions.generateTitle(input)
        if (result.kind === "ErrorResult") return result
        return ok({ title: result.value })
      },
    ),
  }
}
