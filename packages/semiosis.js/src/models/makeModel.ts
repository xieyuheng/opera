import type { Database } from "../database/index.ts"
import { readProviderConfig } from "../provider/index.ts"
import type { Model, ModelRef } from "../model/index.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"

export type MakeModelOptions = {
  database: Database
}

export async function makeModel(
  ref: ModelRef,
  options: MakeModelOptions,
): Promise<Model> {
  switch (ref.providerName) {
    case "deepseek": {
      const client = DeepSeek.makeClient(
        await DeepSeek.readClientConfig(options.database),
      )
      const config = await DeepSeek.readModelConfig(options.database, ref.name)
      return DeepSeek.makeModel(client, config)
    }

    case "openrouter": {
      const client = OpenRouter.makeClient(
        await OpenRouter.readClientConfig(options.database),
      )
      const config = await OpenRouter.readModelConfig(
        options.database,
        ref.name,
      )
      return OpenRouter.makeModel(client, config)
    }

    default:
      throw new Error(`unknown provider: ${ref.providerName}`)
  }
}

export async function readDefaultModelRef(
  database: Database,
): Promise<ModelRef | undefined> {
  const settings = await database.settings.get()
  const providerName = settings?.defaultProvider

  if (providerName === undefined || providerName === null) {
    return undefined
  }

  const providerConfig = await readProviderConfig(database, providerName)

  if (providerConfig.defaultModel === null) {
    return undefined
  }

  return {
    providerName,
    name: providerConfig.defaultModel,
  }
}
