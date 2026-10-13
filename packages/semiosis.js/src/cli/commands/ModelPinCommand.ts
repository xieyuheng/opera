import type * as Cli from "@windbell/cli.js"
import type { Database } from "../../database/index.ts"
import { pinModel } from "../../models/index.ts"
import { readOptionalOption } from "../options.ts"
import { unwrap } from "@windbell/std.js/result"

export type ModelPinCommandOptions = {
  database: Database
}

export function makeModelPinHandler(options: ModelPinCommandOptions) {
  return async (context: Cli.HandlerContext) => {
    const modelName = context.argValues["model-name"]

    if (modelName === undefined) {
      throw new Error("expected command: model pin <model-name>")
    }

    const providerOption = readOptionalOption(context.options, "--provider")
    const settings = unwrap(await options.database.settings.get())
    const providerName = providerOption ?? settings?.defaultProvider

    if (providerName === undefined || providerName === null) {
      throw new Error("default provider is not configured")
    }

    await pinModel(options.database, providerName, modelName)
    console.log(`pinned: ${providerName}/${modelName}`)
  }
}
