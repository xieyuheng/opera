import type * as Cli from "@xieyuheng/cli.ts"
import { unwrap } from "@xieyuheng/std.ts/result"

import type { Database } from "../../database/index.ts"
import { setDefaultModel } from "../../models/index.ts"
import { readOptionalOption } from "../options.ts"

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
