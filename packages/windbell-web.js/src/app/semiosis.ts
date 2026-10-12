import { makeHttpFileSystemClient } from "@windbell/fs.js/http-fs/client"
import { makeSemiosis, type Semiosis } from "@windbell/semiosis.js"
import { makeHttpBash, makeHttpPwsh } from "@windbell/sh.js/http-sh/client"
import { makePath } from "@windbell/std.js/path"
import { unwrap } from "@windbell/std.js/result"

type WebConfig = {
  databaseRoot: string
  shellName: string
}

let semiosisPromise: Promise<Semiosis> | undefined

async function loadConfig(): Promise<WebConfig> {
  const response = await fetch("/api/config")

  if (!response.ok) {
    throw new Error(`failed to load config: HTTP ${response.status}`)
  }

  return (await response.json()) as WebConfig
}

async function makeWebSemiosis(): Promise<Semiosis> {
  const config = await loadConfig()
  const fs = makeHttpFileSystemClient({ baseUrl: "/api/fs" })
  const platform = unwrap(await fs.platform())
  const path = makePath(platform.pathStyle)
  const sh =
    config.shellName === "pwsh"
      ? makeHttpPwsh({ baseUrl: "/api/sh" })
      : makeHttpBash({ baseUrl: "/api/sh" })

  return makeSemiosis({
    fs,
    path,
    root: config.databaseRoot,
    sh,
  })
}

export function getSemiosis(): Promise<Semiosis> {
  semiosisPromise ??= makeWebSemiosis()
  return semiosisPromise
}

export const semiosis = {
  providers: {
    async list() {
      return (await getSemiosis()).providers.list()
    },

    async get(providerName: string) {
      return (await getSemiosis()).providers.get(providerName)
    },

    async getApiKeyStatus(providerName: string) {
      return {
        configured: await (
          await getSemiosis()
        ).providers.getApiKeyStatus(providerName),
      }
    },

    async listModels(options: { providerName: string; all?: boolean }) {
      return (await getSemiosis()).providers.listModels(options)
    },

    async pinModel(options: { providerName: string; modelName: string }) {
      return (await getSemiosis()).providers.pinModel(options)
    },

    async unpinModel(options: { providerName: string; modelName: string }) {
      return (await getSemiosis()).providers.unpinModel(options)
    },

    async setDefaultModel(options: {
      providerName: string
      modelName: string
    }) {
      return (await getSemiosis()).providers.setDefaultModel(options)
    },

    async putApiKey(options: { providerName: string; key: string }) {
      return (await getSemiosis()).providers.putApiKey(options)
    },

    async deleteApiKey(providerName: string) {
      return (await getSemiosis()).providers.deleteApiKey(providerName)
    },
  },

  settings: {
    async get() {
      return (await getSemiosis()).settings.get()
    },

    async put(settings: Parameters<Semiosis["settings"]["put"]>[0]) {
      return (await getSemiosis()).settings.put(settings)
    },
  },

  workspaces: {
    async list() {
      return (await getSemiosis()).workspaces.list()
    },

    async ensure(options: { name: string; root: string }) {
      return (await getSemiosis()).workspaces.ensure(options)
    },

    async get(id: string) {
      return (await getSemiosis()).workspaces.get(id)
    },

    async put(workspace: Parameters<Semiosis["workspaces"]["put"]>[0]) {
      return (await getSemiosis()).workspaces.put(workspace)
    },

    async remove(id: string) {
      return (await getSemiosis()).workspaces.remove(id)
    },
  },

  sessions: {
    async list(options: { workspaceId: string | undefined }) {
      return (await getSemiosis()).sessions.list(options)
    },

    async make(options: { workspaceId: string; title: string }) {
      return (await getSemiosis()).sessions.make(options)
    },

    async get(id: string) {
      return (await getSemiosis()).sessions.get(id)
    },

    async put(session: Parameters<Semiosis["sessions"]["put"]>[0]) {
      return (await getSemiosis()).sessions.put(session)
    },

    async generateTitle(
      options: Parameters<Semiosis["sessions"]["generateTitle"]>[0],
    ) {
      return (await getSemiosis()).sessions.generateTitle(options)
    },

    interpret(
      options: Parameters<Semiosis["sessions"]["interpret"]>[0],
    ): ReturnType<Semiosis["sessions"]["interpret"]> {
      return (async function* () {
        const current = await getSemiosis()
        yield* current.sessions.interpret(options)
      })()
    },

    async remove(id: string) {
      return (await getSemiosis()).sessions.remove(id)
    },
  },

  dustbin: {
    sessions: {
      async list(options: { workspaceId: string | undefined }) {
        return (await getSemiosis()).dustbin.sessions.list(options)
      },

      async get(id: string) {
        return (await getSemiosis()).dustbin.sessions.get(id)
      },

      async trash(id: string) {
        return (await getSemiosis()).dustbin.sessions.trash(id)
      },

      async restore(id: string) {
        return (await getSemiosis()).dustbin.sessions.restore(id)
      },

      async remove(id: string) {
        return (await getSemiosis()).dustbin.sessions.remove(id)
      },
    },

    workspaces: {
      async list() {
        return (await getSemiosis()).dustbin.workspaces.list()
      },

      async get(id: string) {
        return (await getSemiosis()).dustbin.workspaces.get(id)
      },

      async trash(id: string) {
        return (await getSemiosis()).dustbin.workspaces.trash(id)
      },

      async restore(id: string) {
        return (await getSemiosis()).dustbin.workspaces.restore(id)
      },

      async remove(id: string) {
        return (await getSemiosis()).dustbin.workspaces.remove(id)
      },
    },
  },
}
