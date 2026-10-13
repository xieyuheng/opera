import type * as S from "@windbell/semiosis.js"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type {
  GenerateSessionTitle,
  GetSession,
  ListSessions,
  MakeSession,
  PutSession,
  RemoveSession,
} from "../services/Sessions.ts"

export type SessionsControllerOptions = {
  listSessions: ReturnType<typeof ListSessions>
  makeSession: ReturnType<typeof MakeSession>
  getSession: ReturnType<typeof GetSession>
  putSession: ReturnType<typeof PutSession>
  removeSession: ReturnType<typeof RemoveSession>
  generateSessionTitle: ReturnType<typeof GenerateSessionTitle>
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

export function makeSessionsController(options: SessionsControllerOptions) {
  return {
    list: makeAction(ListSessionsInputSchema, (input) =>
      options.listSessions(input),
    ),

    make: makeAction(
      MakeSessionInputSchema,
      (input) => options.makeSession(input),
      { status: 201 },
    ),

    get: makeAction(GetSessionInputSchema, (input) =>
      options.getSession(input),
    ),

    put: makeAction(PutSessionInputSchema, (input) =>
      options.putSession(input),
    ),

    remove: makeAction(RemoveSessionInputSchema, (input) =>
      options.removeSession(input),
    ),

    generateTitle: makeAction(GenerateSessionTitleInputSchema, (input) =>
      options.generateSessionTitle(input),
    ),
  }
}
