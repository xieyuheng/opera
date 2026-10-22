import assert from "node:assert/strict"
import { test } from "node:test"

import { makeCli } from "../cli/makeCli.ts"

test("windbell cli defines routes", () => {
  const cli = makeCli()

  assert.ok(cli.routes.start)
  assert.ok(cli.routes.dev)
  assert.ok(cli.routes["provider list"])
  assert.ok(cli.routes["provider default"])
  assert.ok(cli.routes["api-key put"])
  assert.ok(cli.routes["api-key delete"])
  assert.ok(cli.routes["model pin"])
  assert.ok(cli.routes["model unpin"])
  assert.ok(cli.routes["model list"])
  assert.ok(cli.routes["model default"])
  assert.ok(cli.routes.repl)
  assert.ok(cli.routes.batch)
})
