import { makeHttpFileSystemClient } from "@windbell/fs.js/http-fs/client"
import { makeSemiosis, type Semiosis } from "@windbell/semiosis.js"
import { makeHttpBash, makeHttpPwsh } from "@windbell/sh.js/http-sh/client"
import { makePath } from "@windbell/std.js/path"
import { unwrap } from "@windbell/std.js/result"

export let semiosis: Semiosis

type WebConfig = {
  databaseRoot: string
  shellName: string
}

async function loadConfig(): Promise<WebConfig> {
  const response = await fetch("/api/config")

  if (!response.ok) {
    throw new Error(`failed to load config: HTTP ${response.status}`)
  }

  return (await response.json()) as WebConfig
}

export async function initSemiosis(): Promise<void> {
  const config = await loadConfig()
  const fs = makeHttpFileSystemClient({ baseUrl: "/api/fs" })
  const platform = unwrap(await fs.platform())
  const path = makePath(platform.pathStyle)
  const sh =
    config.shellName === "pwsh"
      ? makeHttpPwsh({ baseUrl: "/api/sh" })
      : makeHttpBash({ baseUrl: "/api/sh" })

  semiosis = makeSemiosis({
    fs,
    path,
    root: config.databaseRoot,
    sh,
  })
}
