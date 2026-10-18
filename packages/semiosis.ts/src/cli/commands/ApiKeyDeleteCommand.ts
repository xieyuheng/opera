import type * as Cli from "@windbell/cli.ts"
import type { Database } from "../../database/index.ts"
import { deleteApiKey } from "../../database/index.ts"
import { providerNames } from "../../providers/providerNames.ts"

export type ApiKeyDeleteCommandOptions = {
  database: Database
}

export function makeApiKeyDeleteHandler(options: ApiKeyDeleteCommandOptions) {
  return async (context: Cli.HandlerContext) => {
    const providerName = context.argValues["provider-name"]

    if (providerName === undefined) {
      throw new Error("expected command: api-key delete <provider-name>")
    }

    assertSupportedProvider(providerName)

    const deleted = await deleteApiKey(options.database, providerName)

    if (deleted) {
      console.log(`api key deleted: ${providerName}`)
    } else {
      console.log(`api key not found: ${providerName}`)
    }
  }
}

function assertSupportedProvider(providerName: string): void {
  if (!(providerNames as readonly string[]).includes(providerName)) {
    throw new Error(`unsupported provider: ${providerName}`)
  }
}
