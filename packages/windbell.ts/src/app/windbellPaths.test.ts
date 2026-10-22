import assert from "node:assert/strict"
import Path from "node:path"
import { test } from "node:test"

import { resolveWindbellPaths } from "./windbellPaths.ts"

test("resolveWindbellPaths uses the opera var layout", () => {
  const operaHome = Path.resolve("opera-test-home")

  assert.deepEqual(resolveWindbellPaths({ operaHome }), {
    databaseRoot: Path.join(operaHome, "var", "windbell", "database"),
    lockRoot: Path.join(operaHome, "var", "windbell", "session-locks"),
  })
})

test("resolveWindbellPaths accepts final path overrides", () => {
  const operaHome = Path.resolve("opera-test-home")
  const databaseRoot = Path.resolve("custom-database")
  const lockRoot = Path.resolve("custom-session-locks")

  assert.deepEqual(
    resolveWindbellPaths({ operaHome, databaseRoot, lockRoot }),
    {
      databaseRoot,
      lockRoot,
    },
  )
})
