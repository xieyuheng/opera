import process from "node:process"

import type { Sign } from "../sign/index.ts"
import { assertSessionShellName } from "./assertSessionShellName.ts"
import { platformShellName } from "./makeDefaultToolRouter.ts"

export function assertSessionToolPlatform(
  signs: Array<Sign>,
  platform: NodeJS.Platform = process.platform,
): void {
  assertSessionShellName(signs, platformShellName(platform))
}
