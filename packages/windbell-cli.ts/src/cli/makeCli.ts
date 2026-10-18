import * as Cli from "@windbell/cli.ts"
import { getPackageJson } from "@windbell/std.ts/node"
import { fileURLToPath } from "node:url"
import { makeDevHandler } from "./commands/dev.ts"
import { makeStartHandler } from "./commands/start.ts"

export function makeCli() {
  const { version } = getPackageJson(fileURLToPath(import.meta.url))
  const router = Cli.makeRouter("windbell-cli.ts", version)

  router.defineRoutes([
    {
      path: ["start"],
      options: {
        "--host": { valueName: "host" },
        "--port": { valueName: "port" },
        "--cors-origin": { valueName: "origin" },
        "--windbell-root": { valueName: "path" },
        "--web-dist-root": { valueName: "path" },
      },
      description: "start windbell api and web",
      handler: makeStartHandler(),
    },
    {
      path: ["dev"],
      options: {
        "--host": { valueName: "host" },
        "--api-port": { valueName: "port" },
        "--web-port": { valueName: "port" },
        "--windbell-root": { valueName: "path" },
        "--web-source-root": { valueName: "path" },
      },
      description: "start windbell api and web dev server",
      handler: makeDevHandler(),
    },
  ])

  return router
}
