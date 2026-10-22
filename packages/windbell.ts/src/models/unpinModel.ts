import type { Database } from "../database/index.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"

export async function unpinModel(
  database: Database,
  providerName: string,
  name: string,
): Promise<boolean> {
  switch (providerName) {
    case "deepseek": {
      return await DeepSeek.unpinModel(database, name)
    }

    case "openrouter": {
      return await OpenRouter.unpinModel(database, name)
    }

    default: {
      throw new Error(`unknown provider: ${providerName}`)
    }
  }
}
