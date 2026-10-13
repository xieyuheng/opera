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
    list: makeAction(ListSessionsInputSchema, async (input) => {
      return ok(await options.sessions.list(input))
    }),

    make: makeAction(
      MakeSessionInputSchema,
      async (input) => {
        try {
          return ok(await options.sessions.make(input))
        } catch (error) {
          return err({
            type: "session-make-failed",
            status: 400,
            message: error instanceof Error ? error.message : String(error),
          })
        }
      },
      { status: 201 },
    ),

    get: makeAction(GetSessionInputSchema, async (input) => {
      const session = await options.sessions.get(input.sessionId)

      if (session === undefined) {
        return err({
          type: "session-not-found",
          status: 404,
          message: "session not found",
          info: { sessionId: input.sessionId },
        })
      }

      return ok(session)
    }),

    put: makeAction(PutSessionInputSchema, async (input) => {
      if (input.session.id !== input.sessionId) {
        return err({
          type: "session-id-mismatch",
          status: 400,
          message: "session id mismatch",
        })
      }

      await options.sessions.put(input.session)
      return ok(null)
    }),

    remove: makeAction(RemoveSessionInputSchema, async (input) => {
      await options.sessions.remove(input.sessionId)
      return ok(null)
    }),

    generateTitle: makeAction(
      GenerateSessionTitleInputSchema,
      async (input) => {
        const title = await options.sessions.generateTitle(input)
        return ok({ title })
      },
    ),
  }
}
