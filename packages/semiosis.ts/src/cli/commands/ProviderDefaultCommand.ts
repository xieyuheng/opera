import type * as Cli from "@windbell/cli.ts"
import type { Database } from "../../database/index.ts"
import { setDefaultProvider } from "../../settings/setDefaultProvider.ts"

export type ProviderDefaultCommandOptions = {
  database: Database
}

export function makeProviderDefaultHandler(
  options: ProviderDefaultCommandOptions,
) {
  return async (context: Cli.HandlerContext) => {
    const providerName = context.argValues["provider-name"]

    if (providerName === undefined) {
      throw new Error("expected command: provider default <provider-name>")
    }

    await setDefaultProvider(options.database, providerName)
    console.log(`default provider: ${providerName}`)
  }
}
