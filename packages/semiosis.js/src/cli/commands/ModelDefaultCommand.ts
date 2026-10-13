import type * as Cli from "@windbell/cli.js"
import type { Database } from "../../database/index.ts"
import { setDefaultModel } from "../../models/index.ts"
import { readOptionalOption } from "../options.ts"
import { unwrap } from "@windbell/std.js/result"

export type ModelDefaultCommandOptions = {
  database: Database
}

export function makeModelDefaultHandler(options: ModelDefaultCommandOptions) {
  return async (context: Cli.HandlerContext) => {
    const modelName = context.argValues["model-name"]

    if (modelName === undefined) {
      throw new Error("expected command: model default <model-name>")
    }

    const providerOption = readOptionalOption(context.options, "--provider")
    const settings = unwrap(await options.database.settings.get())
    const providerName = providerOption ?? settings?.defaultProvider

    if (providerName === undefined || providerName === null) {
      throw new Error("default provider is not configured")
    }

    await setDefaultModel(options.database, providerName, modelName)
    console.log(`default model: ${providerName}/${modelName}`)
  }
}
