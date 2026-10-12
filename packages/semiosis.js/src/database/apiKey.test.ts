import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import {
  apiKeyPath,
  deleteApiKey,
  hasApiKey,
  readApiKey,
  writeApiKey,
} from "./apiKey.ts"
import { makeNodeDatabase } from "./index.ts"

test("write, read and delete provider api key", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-api-key-"))

  try {
    const database = makeNodeDatabase({ root })

    assert.equal(await hasApiKey(database, "deepseek"), false)

    await writeApiKey(database, "deepseek", "  sk-test  \n")
    assert.equal(await hasApiKey(database, "deepseek"), true)
    assert.equal(await readApiKey(database, "deepseek"), "sk-test")

    assert.equal(await deleteApiKey(database, "deepseek"), true)
    assert.equal(await hasApiKey(database, "deepseek"), false)
    assert.equal(await deleteApiKey(database, "deepseek"), false)

    await assert.rejects(
      () => readApiKey(database, "deepseek"),
      /api key not found/,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("writeApiKey rejects empty api key", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-api-key-"))

  try {
    const database = makeNodeDatabase({ root })

    await assert.rejects(
      () => writeApiKey(database, "deepseek", "   \n"),
      /api key is empty/,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("hasApiKey returns false for whitespace-only file", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-api-key-"))

  try {
    const database = makeNodeDatabase({ root })
    const path = apiKeyPath(database, "deepseek")

    await fs.mkdir(Path.dirname(path), { recursive: true })
    await fs.writeFile(path, "   \n")

    assert.equal(await hasApiKey(database, "deepseek"), false)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
