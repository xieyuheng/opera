import type * as Cli from "@xieyuheng/cli.ts"
import { unwrap } from "@xieyuheng/std.ts/result"
import type { Database } from "@xieyuheng/windbell.ts"
import { unpinModel } from "@xieyuheng/windbell.ts"

import { readOptionalOption } from "../options.ts"

export type ModelUnpinCommandOptions = {
  database: Database
}

export function makeModelUnpinHandler(options: ModelUnpinCommandOptions) {
  return async (context: Cli.HandlerContext) => {
    const modelName = context.argValues["model-name"]

    if (modelName === undefined) {
      throw new Error("expected command: model unpin <model-name>")
    }

    const providerOption = readOptionalOption(context.options, "--provider")
    const settings = unwrap(await options.database.settings.get())
    const providerName = providerOption ?? settings?.defaultProvider

    if (providerName === undefined || providerName === null) {
      throw new Error("default provider is not configured")
    }

    const unpinned = await unpinModel(options.database, providerName, modelName)

    if (!unpinned) {
      console.log(`model not pinned: ${providerName}/${modelName}`)
      return
    }

    console.log(`unpinned: ${providerName}/${modelName}`)
  }
}
