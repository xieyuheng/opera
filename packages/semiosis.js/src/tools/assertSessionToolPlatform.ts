import process from "node:process"
import { isToolSign, type Sign } from "../sign/index.ts"
import { platformShellName } from "./makeDefaultToolRouter.ts"

const shellToolNames = new Set(["bash", "pwsh"])

export function assertSessionToolPlatform(
  signs: Array<Sign>,
  platform: NodeJS.Platform = process.platform,
): void {
  const expectedShellTool = platformShellName(platform)
  const sessionShellTools = signs
    .filter(isToolSign)
    .map((sign) => sign.name)
    .filter((name) => shellToolNames.has(name))

  for (const name of sessionShellTools) {
    if (name !== expectedShellTool) {
      throw new Error(
        `[assertSessionToolPlatform] session shell tool "${name}" does not match platform "${platform}"; expected "${expectedShellTool}"`,
      )
    }
  }
}
