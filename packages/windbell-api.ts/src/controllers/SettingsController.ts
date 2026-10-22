import type * as W from "@xieyuheng/windbell.ts"
import { z } from "zod"

import { makeAction } from "../http/makeAction.ts"

export type SettingsControllerOptions = {
  settings: W.SettingsService
}

export const PutSettingsInputSchema = z.object({
  settings: z.custom<W.Settings>(),
})

export function makeSettingsController(options: SettingsControllerOptions) {
  return {
    get: makeAction(z.object({}), () => options.settings.get()),

    put: makeAction(PutSettingsInputSchema, (input) =>
      options.settings.put(input.settings),
    ),
  }
}
