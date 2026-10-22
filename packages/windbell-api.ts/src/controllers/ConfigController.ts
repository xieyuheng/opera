import { ok } from "@xieyuheng/std.ts/result"
import { z } from "zod"

import { makeAction } from "../http/makeAction.ts"

export type ConfigControllerOptions = {
  databaseRoot: string
  lockRoot: string
  shellName: string
}

export function makeConfigController(options: ConfigControllerOptions) {
  return {
    get: makeAction(z.object({}), async () =>
      ok({
        databaseRoot: options.databaseRoot,
        lockRoot: options.lockRoot,
        shellName: options.shellName,
      }),
    ),
  }
}
