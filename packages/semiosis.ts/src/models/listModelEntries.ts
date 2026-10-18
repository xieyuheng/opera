import type { Database } from "../database/index.ts"
import { readProviderConfig } from "../provider/index.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"
import type {
  DeepSeekModelEntry,
  OpenRouterModelEntry,
  ModelEntry,
} from "./ModelEntry.ts"

export type ListModelEntriesOptions = {
  all?: boolean
}

export async function listModelEntries(
  database: Database,
  providerName: string,
  options: ListModelEntriesOptions = {},
): Promise<Array<ModelEntry>> {
  switch (providerName) {
    case "deepseek": {
      return await listDeepSeekEntries(database, options)
    }

    case "openrouter": {
      return await listOpenRouterEntries(database, options)
    }

    default: {
      throw new Error(`unknown provider: ${providerName}`)
    }
  }
}

async function listDeepSeekEntries(
  database: Database,
  options: ListModelEntriesOptions,
): Promise<Array<DeepSeekModelEntry>> {
  const providerConfig = await readProviderConfig(database, "deepseek")
  const configs = await DeepSeek.readModelConfigs(database)

  const entries: Array<DeepSeekModelEntry> = Object.keys(configs).map(
    (name) => {
      const config = DeepSeek.parseModelConfig(name, configs[name])

      return {
        providerName: "deepseek",
        name,
        pinned: config.pinned,
        isDefault: providerConfig.defaultModel === name,
        config,
        info: null,
      }
    },
  )
  entries.sort(compareModelEntries)

  if (options.all === true) {
    const infos = await DeepSeek.listAvailableModels(database)

    mergeInfoEntries(entries, infos, {
      providerName: "deepseek",
      defaultModel: providerConfig.defaultModel,
    })
  }

  return entries
}

async function listOpenRouterEntries(
  database: Database,
  options: ListModelEntriesOptions,
): Promise<Array<OpenRouterModelEntry>> {
  const providerConfig = await readProviderConfig(database, "openrouter")
  const configs = await OpenRouter.readModelConfigs(database)

  const entries: Array<OpenRouterModelEntry> = Object.keys(configs).map(
    (name) => {
      const config = OpenRouter.parseModelConfig(name, configs[name])

      return {
        providerName: "openrouter",
        name,
        pinned: config.pinned,
        isDefault: providerConfig.defaultModel === name,
        config,
        info: null,
      }
    },
  )
  entries.sort(compareModelEntries)

  if (options.all === true) {
    const infos = await OpenRouter.listAvailableModels(database)

    mergeInfoEntries(entries, infos, {
      providerName: "openrouter",
      defaultModel: providerConfig.defaultModel,
    })
  }

  return entries
}

function mergeInfoEntries<Info extends { id: string }>(
  entries: Array<{
    providerName: string
    name: string
    pinned: boolean
    isDefault: boolean
    config: unknown
    info: Info | null
  }>,
  infos: Array<Info>,
  options: {
    providerName: string
    defaultModel: string | null
  },
): void {
  const infoByName = new Map(infos.map((info) => [info.id, info]))
  const seen = new Set<string>()

  for (const entry of entries) {
    const info = infoByName.get(entry.name)
    if (info !== undefined) {
      entry.info = info
      seen.add(entry.name)
    }
  }

  for (const info of infos) {
    if (seen.has(info.id)) continue

    entries.push({
      providerName: options.providerName,
      name: info.id,
      pinned: false,
      isDefault: options.defaultModel === info.id,
      config: null,
      info,
    })
  }

  entries.sort(compareModelEntries)
}

function compareModelEntries(
  a: { name: string; pinned: boolean },
  b: { name: string; pinned: boolean },
): number {
  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1

  return a.name.localeCompare(b.name)
}
