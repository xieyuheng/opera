import { z } from "zod"

import { decodeWorkspaceSessionCursor } from "../api/cursor.ts"
import { makeAction } from "../http/makeAction.ts"
import type {
  LoadHomeData,
  LoadProviderData,
  LoadProviderListData,
  LoadSessionData,
  LoadSessionDustbinData,
  LoadWorkspaceData,
  LoadWorkspaceDustbinData,
} from "../services/Page.ts"

export type PageControllerOptions = {
  loadHomeData: ReturnType<typeof LoadHomeData>
  loadWorkspaceData: ReturnType<typeof LoadWorkspaceData>
  loadSessionData: ReturnType<typeof LoadSessionData>
  loadSessionDustbinData: ReturnType<typeof LoadSessionDustbinData>
  loadWorkspaceDustbinData: ReturnType<typeof LoadWorkspaceDustbinData>
  loadProviderListData: ReturnType<typeof LoadProviderListData>
  loadProviderData: ReturnType<typeof LoadProviderData>
}

const PreviewLimitSchema = z.coerce.number().int().nonnegative()
const PageLimitSchema = z.coerce.number().int().positive().default(10)
const WorkspaceCursorSchema = z
  .string()
  .transform((value, context) => {
    const cursor = decodeWorkspaceSessionCursor(value)

    if (cursor === undefined) {
      context.addIssue({
        code: "custom",
        message: "invalid workspace cursor",
      })
      return z.NEVER
    }

    return cursor
  })
  .optional()

export const LoadWorkspaceDataInputSchema = z.object({
  workspaceId: z.string(),
  previewLimit: PreviewLimitSchema,
  limit: PageLimitSchema,
  cursor: WorkspaceCursorSchema,
})

export const LoadSessionDataInputSchema = z.object({
  sessionId: z.string(),
})

export const LoadSessionDustbinDataInputSchema = z
  .object({
    workspaceId: z.string().optional(),
    previewLimit: PreviewLimitSchema,
  })
  .transform((input) => ({
    workspaceId: input.workspaceId,
    previewLimit: input.previewLimit,
  }))

export const LoadProviderDataInputSchema = z.object({
  providerName: z.string(),
})

export function makePageController(options: PageControllerOptions) {
  return {
    home: makeAction(z.object({}), () => options.loadHomeData()),

    workspace: makeAction(LoadWorkspaceDataInputSchema, (input) =>
      options.loadWorkspaceData(input),
    ),

    session: makeAction(LoadSessionDataInputSchema, (input) =>
      options.loadSessionData(input),
    ),

    sessionDustbin: makeAction(LoadSessionDustbinDataInputSchema, (input) =>
      options.loadSessionDustbinData(input),
    ),

    workspaceDustbin: makeAction(z.object({}), () =>
      options.loadWorkspaceDustbinData(),
    ),

    providerList: makeAction(z.object({}), () =>
      options.loadProviderListData(),
    ),

    provider: makeAction(LoadProviderDataInputSchema, (input) =>
      options.loadProviderData(input),
    ),
  }
}
