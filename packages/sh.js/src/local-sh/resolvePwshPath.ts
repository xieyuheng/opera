import { lstatSync } from "node:fs"
import { join } from "node:path"
import process from "node:process"

export function candidatePwshPaths(
  env: NodeJS.ProcessEnv = process.env,
): Array<string> {
  const programFiles = env.ProgramFiles ?? "C:\\Program Files"
  const systemRoot = env.SystemRoot ?? "C:\\Windows"

  const candidates = [join(programFiles, "PowerShell", "7", "pwsh.exe")]

  for (const entry of (env.PATH ?? "").split(";")) {
    const trimmed = entry.trim().replace(/^"|"$/g, "")
    if (trimmed !== "") {
      candidates.push(join(trimmed, "pwsh.exe"))
    }
  }

  candidates.push(
    join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
  )

  return candidates
}

export function resolvePwshPath(
  configured?: string,
  env: NodeJS.ProcessEnv = process.env,
  platform: NodeJS.Platform = process.platform,
): string {
  if (configured !== undefined && configured !== "") return configured

  if (platform === "win32") {
    for (const candidate of candidatePwshPaths(env)) {
      if (candidateExists(candidate)) return candidate
    }
  }

  return "pwsh"
}

function candidateExists(candidate: string): boolean {
  try {
    const stat = lstatSync(candidate)
    return stat.isFile() || stat.isSymbolicLink()
  } catch {
    return false
  }
}
