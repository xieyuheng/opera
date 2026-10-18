import assert from "node:assert/strict"
import { test } from "node:test"
import { makeCli } from "../cli/makeCli.ts"

test("windbell cli defines routes", () => {
  const cli = makeCli()

  assert.ok(cli.routes.start)
  assert.ok(cli.routes.dev)
})
