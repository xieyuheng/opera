import type * as Cli from "@windbell/cli.ts"

import { resolveDevOptions } from "../dev/resolveDevOptions.ts"
import { runDev } from "../dev/runDev.ts"

export function makeDevHandler() {
  return async (context: Cli.HandlerContext) => {
    const options = resolveDevOptions(context.options)
    await runDev(options)
  }
}
