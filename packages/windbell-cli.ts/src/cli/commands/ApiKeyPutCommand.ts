import process from "node:process"

import type * as Cli from "@xieyuheng/cli.ts"
import type { Database } from "@xieyuheng/windbell.ts"
import { providerNames, writeApiKey } from "@xieyuheng/windbell.ts"

import { readLine } from "../input.ts"

export type ApiKeyPutCommandOptions = {
  database: Database
  readLine?: (prompt: string) => Promise<string | undefined>
}

export function makeApiKeyPutHandler(options: ApiKeyPutCommandOptions) {
  const readLineFn = options.readLine ?? readLine

  return async (context: Cli.HandlerContext) => {
    const providerName = context.argValues["provider-name"]

    if (providerName === undefined) {
      throw new Error("expected command: api-key put <provider-name>")
    }

    assertSupportedProvider(providerName)

    const line = await readLineFn(`api key for ${providerName}: `)
    if (line === undefined) {
      process.exitCode = 1
      return
    }

    const key = line.trim()
    if (key === "") {
      throw new Error("api key is empty")
    }

    await writeApiKey(options.database, providerName, key)
    console.log(`api key set: ${providerName}`)
  }
}

function assertSupportedProvider(providerName: string): void {
  if (!(providerNames as readonly string[]).includes(providerName)) {
    throw new Error(`unsupported provider: ${providerName}`)
  }
}
