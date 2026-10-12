import type * as S from "@windbell/semiosis.js/node"
import { makeJsonEndpoint } from "@windbell/http.js"
import type { SemiosisClientConfig } from "./SemiosisClient.ts"
import { SettingsSchema, VoidSchema } from "./schemas.ts"

export type SettingsClient = {
  get(): Promise<S.Settings>
  put(settings: S.Settings): Promise<void>
}

export function makeSettingsClient(
  config: SemiosisClientConfig,
): SettingsClient {
  return {
    get: makeJsonEndpoint(config, {
      method: "GET",
      path: "/settings",
      output: SettingsSchema,
    }),

    put: makeJsonEndpoint(config, {
      method: "PUT",
      path: "/settings",
      body: (settings: S.Settings) => settings,
      output: VoidSchema,
    }),
  }
}
