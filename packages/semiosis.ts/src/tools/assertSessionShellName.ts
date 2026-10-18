import { isToolSign, type Sign } from "../sign/index.ts"

const shellToolNames = new Set(["bash", "pwsh"])

export function assertSessionShellName(
  signs: Array<Sign>,
  shellName: string,
): void {
  const sessionShellTools = signs
    .filter(isToolSign)
    .map((sign) => sign.name)
    .filter((name) => shellToolNames.has(name))

  for (const name of sessionShellTools) {
    if (name !== shellName) {
      throw new Error(
        `[assertSessionShellName] session shell tool "${name}" does not match shell "${shellName}"`,
      )
    }
  }
}
