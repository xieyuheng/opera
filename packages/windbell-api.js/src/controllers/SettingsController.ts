import type * as S from "@windbell/semiosis.js"
import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"

export type SettingsControllerOptions = {
  settings: S.SettingsService
}

export const PutSettingsInputSchema = z.object({
  settings: z.custom<S.Settings>(),
})

export function makeSettingsController(options: SettingsControllerOptions) {
  return {
    get: makeAction(z.object({}), () => options.settings.get()),

    put: makeAction(PutSettingsInputSchema, (input) =>
      options.settings.put(input.settings),
    ),
  }
}
