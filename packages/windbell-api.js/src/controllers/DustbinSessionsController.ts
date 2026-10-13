import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type {
  GetDustbinSession,
  ListDustbinSessions,
  RemoveDustbinSession,
  RestoreDustbinSession,
  TrashDustbinSession,
} from "../services/DustbinSessions.ts"

export type DustbinSessionsControllerOptions = {
  listDustbinSessions: ReturnType<typeof ListDustbinSessions>
  getDustbinSession: ReturnType<typeof GetDustbinSession>
  trashDustbinSession: ReturnType<typeof TrashDustbinSession>
  restoreDustbinSession: ReturnType<typeof RestoreDustbinSession>
  removeDustbinSession: ReturnType<typeof RemoveDustbinSession>
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

export function makeDustbinSessionsController(
  options: DustbinSessionsControllerOptions,
) {
  return {
    list: makeAction(ListDustbinSessionsInputSchema, (input) =>
      options.listDustbinSessions(input),
    ),

    get: makeAction(GetDustbinSessionInputSchema, (input) =>
      options.getDustbinSession(input),
    ),

    trash: makeAction(TrashDustbinSessionInputSchema, (input) =>
      options.trashDustbinSession(input),
    ),

    restore: makeAction(RestoreDustbinSessionInputSchema, (input) =>
      options.restoreDustbinSession(input),
    ),

    remove: makeAction(RemoveDustbinSessionInputSchema, (input) =>
      options.removeDustbinSession(input),
    ),
  }
}
