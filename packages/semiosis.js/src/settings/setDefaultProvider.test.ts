import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeNodeDatabase } from "../database/index.ts"
import { setDefaultProvider } from "./setDefaultProvider.ts"

test("setDefaultProvider writes settings.defaultProvider", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-set-default-provider-"),
  )

  try {
    const database = makeNodeDatabase({ root })

    await setDefaultProvider(database, "deepseek")

    assert.deepEqual(await database.settings.get(), {
      defaultProvider: "deepseek",
      themeId: null,
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("setDefaultProvider rejects unsupported provider", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-set-default-provider-"),
  )

  try {
    const database = makeNodeDatabase({ root })

    await assert.rejects(
      () => setDefaultProvider(database, "unknown"),
      /unsupported provider/,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
