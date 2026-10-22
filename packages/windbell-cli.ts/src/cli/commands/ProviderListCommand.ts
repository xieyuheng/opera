import type * as Cli from "@xieyuheng/cli.ts"
import { unwrap } from "@xieyuheng/std.ts/result"
import type { Database } from "@xieyuheng/windbell.ts"
import {
  hasApiKey,
  providerNames,
  readProviderConfig,
} from "@xieyuheng/windbell.ts"

export type ProviderListCommandOptions = {
  database: Database
}

export function makeProviderListHandler(options: ProviderListCommandOptions) {
  return async (_context: Cli.HandlerContext) => {
    const settings = unwrap(await options.database.settings.get())
    const defaultProvider = settings?.defaultProvider

    for (const providerName of providerNames) {
      const providerConfig = await readProviderConfig(
        options.database,
        providerName,
      )
      const apiKeyConfigured = unwrap(
        await hasApiKey(options.database, providerName),
      )
      const defaultSuffix = providerName === defaultProvider ? " (default)" : ""

      console.log(`${providerName}${defaultSuffix}`)
      console.log(`  baseUrl: ${providerConfig.baseUrl}`)
      console.log(`  defaultModel: ${providerConfig.defaultModel ?? "(none)"}`)
      console.log(
        `  apiKey: ${apiKeyConfigured ? "(configured)" : "(not configured)"}`,
      )
    }
  }
}
