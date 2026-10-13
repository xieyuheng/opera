import * as Cli from "@windbell/cli.js"
import { getPackageJson } from "@windbell/std.js/node"
import { fileURLToPath } from "node:url"
import { resolveAppPaths, defaultAppRoot } from "../app/defaultAppRoot.ts"
import { makeNodeDatabase } from "../node/makeNodeDatabase.ts"
import { makeBatchHandler } from "./commands/BatchCommand.ts"
import { makeModelDefaultHandler } from "./commands/ModelDefaultCommand.ts"
import { makeModelPinHandler } from "./commands/ModelPinCommand.ts"
import { makeModelUnpinHandler } from "./commands/ModelUnpinCommand.ts"
import { makeModelListHandler } from "./commands/ModelListCommand.ts"
import { makeApiKeyDeleteHandler } from "./commands/ApiKeyDeleteCommand.ts"
import { makeApiKeyPutHandler } from "./commands/ApiKeyPutCommand.ts"
import { makeProviderDefaultHandler } from "./commands/ProviderDefaultCommand.ts"
import { makeProviderListHandler } from "./commands/ProviderListCommand.ts"
import { makeReplHandler } from "./commands/ReplCommand.ts"

export function makeCli() {
  const paths = resolveAppPaths(defaultAppRoot())
  const database = makeNodeDatabase({ root: paths.databaseRoot })
  const { version } = getPackageJson(fileURLToPath(import.meta.url))
  const router = Cli.makeRouter("semiosis.js", version)

  router.defineRoutes([
    {
      path: ["provider", "list"],
      description: "list supported providers",
      handler: makeProviderListHandler({ database }),
    },
    {
      path: ["provider", "default"],
      args: ["provider-name"],
      description: "select default provider",
      handler: makeProviderDefaultHandler({ database }),
    },
    {
      path: ["api-key", "put"],
      args: ["provider-name"],
      description: "put provider api key",
      handler: makeApiKeyPutHandler({ database }),
    },
    {
      path: ["api-key", "delete"],
      args: ["provider-name"],
      description: "delete provider api key",
      handler: makeApiKeyDeleteHandler({ database }),
    },
    {
      path: ["model", "pin"],
      args: ["model-name"],
      options: {
        "--provider": { valueName: "provider-name" },
      },
      description: "pin a model",
      handler: makeModelPinHandler({ database }),
    },
    {
      path: ["model", "unpin"],
      args: ["model-name"],
      options: {
        "--provider": { valueName: "provider-name" },
      },
      description: "unpin a model",
      handler: makeModelUnpinHandler({ database }),
    },
    {
      path: ["model", "list"],
      options: {
        "--provider": { valueName: "provider-name" },
        "--all": {},
      },
      description: "list models",
      handler: makeModelListHandler({ database }),
    },
    {
      path: ["model", "default"],
      args: ["model-name"],
      options: {
        "--provider": { valueName: "provider-name" },
      },
      description: "select default model for provider",
      handler: makeModelDefaultHandler({ database }),
    },
    {
      path: ["repl"],
      options: {
        "--provider": { valueName: "provider-name" },
        "--model": { valueName: "model-name" },
        "--session": { valueName: "session-id" },
      },
      description: "start agent repl in current directory",
      handler: makeReplHandler({ database, lockRoot: paths.lockRoot }),
    },
    {
      path: ["batch"],
      options: {
        "--provider": { valueName: "provider-name" },
        "--model": { valueName: "model-name" },
        "--prompts": { valueName: "file", required: true },
        "--cwd": { valueName: "dir" },
        "--max-output-chars": { valueName: "n" },
      },
      description: "run prompts through agent",
      handler: makeBatchHandler({ database, lockRoot: paths.lockRoot }),
    },
  ])

  return router
}
