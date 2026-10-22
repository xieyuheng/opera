import type * as Cli from "@xieyuheng/cli.ts"
import type { Database } from "@xieyuheng/windbell.ts"
import { setDefaultProvider } from "@xieyuheng/windbell.ts"

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
