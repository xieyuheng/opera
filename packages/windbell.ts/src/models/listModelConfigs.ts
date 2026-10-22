import type { Database } from "../database/index.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"

export async function listModelConfigs(
  database: Database,
  providerName: string,
): Promise<Array<string>> {
  switch (providerName) {
    case "deepseek": {
      return await DeepSeek.listModelConfigs(database)
    }

    case "openrouter": {
      return await OpenRouter.listModelConfigs(database)
    }

    default: {
      throw new Error(`unknown provider: ${providerName}`)
    }
  }
}
