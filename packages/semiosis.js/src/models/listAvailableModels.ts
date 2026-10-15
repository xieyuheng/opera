import type { Database } from "../database/index.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"
import type { ModelInfo } from "./ModelEntry.ts"

export async function listAvailableModels(
  database: Database,
  providerName: string,
): Promise<Array<ModelInfo>> {
  switch (providerName) {
    case "deepseek": {
      return await DeepSeek.listAvailableModels(database)
    }

    case "openrouter": {
      return await OpenRouter.listAvailableModels(database)
    }

    default: {
      throw new Error(`unknown provider: ${providerName}`)
    }
  }
}
