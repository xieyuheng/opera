import type * as S from "@windbell/semiosis.js"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type { GetSettings, PutSettings } from "../services/Settings.ts"

export type SettingsControllerOptions = {
  getSettings: ReturnType<typeof GetSettings>
  putSettings: ReturnType<typeof PutSettings>
}

export const PutSettingsInputSchema = z.object({
  settings: z.custom<S.Settings>(),
})

export function makeSettingsController(options: SettingsControllerOptions) {
  return {
    get: makeAction(z.object({}), () => options.getSettings()),

    put: makeAction(PutSettingsInputSchema, (input) =>
      options.putSettings(input),
    ),
  }
}
