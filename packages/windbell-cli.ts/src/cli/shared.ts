import Path from "node:path"

import { unwrap } from "@xieyuheng/std.ts/result"
import {
  makeAgentFromSession,
  makeModel,
  readMockModel,
  readProviderConfig,
  type Agent,
  type Database,
  type Model,
  type ToolRouter,
  type Workspace,
} from "@xieyuheng/windbell.ts"

import { readOptionalOption } from "./options.ts"

export async function makeModelFromOptions(options: {
  database: Database
  cliOptions: Record<string, unknown>
}): Promise<Model> {
  const providerOption = readOptionalOption(options.cliOptions, "--provider")
  const modelOption = readOptionalOption(options.cliOptions, "--model")

  const settings = unwrap(await options.database.settings.get())
  const providerName = providerOption ?? settings?.defaultProvider

  if (providerName === undefined || providerName === null) {
    throw new Error("default provider is not configured")
  }

  if (providerName === "mock") {
    if (modelOption === undefined) {
      throw new Error("model is required for provider: mock")
    }

    return readMockModel(modelOption)
  }

  const providerConfig = await readProviderConfig(
    options.database,
    providerName,
  )

  const name = modelOption ?? providerConfig.defaultModel
  if (name === null || name === undefined) {
    throw new Error(`default model is not configured: ${providerName}`)
  }

  return await makeModel(
    { providerName, name },
    {
      database: options.database,
    },
  )
}

export async function ensureWorkspace(options: {
  database: Database
  cwd: string
}): Promise<Workspace> {
  const root = Path.resolve(options.cwd)

  return unwrap(
    await options.database.workspaces.ensure({
      name: workspaceNameFromRoot(root),
      root,
    }),
  )
}

export async function makeAgentForCli(options: {
  database: Database
  sessionId: string
  model: Model
  toolRouter: ToolRouter
}): Promise<Agent> {
  return await makeAgentFromSession({
    database: options.database,
    sessionId: options.sessionId,
    model: options.model,
    makeToolRouter: () => options.toolRouter,
  })
}

function workspaceNameFromRoot(root: string): string {
  const resolved = Path.resolve(root)
  const name = Path.basename(resolved)
  return name === "" ? resolved : name
}
