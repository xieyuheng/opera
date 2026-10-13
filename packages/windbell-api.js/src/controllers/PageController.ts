import { z } from "zod"
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

export const LoadWorkspaceDataInputSchema = z.object({
  workspaceId: z.string(),
})

export const LoadSessionDataInputSchema = z.object({
  sessionId: z.string(),
})

export const LoadSessionDustbinDataInputSchema = z
  .object({
    workspaceId: z.string().optional(),
  })
  .transform((input) => ({
    workspaceId: input.workspaceId,
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
