import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { unwrap } from "@windbell/std.js/result"
import {
  apiKeyPath,
  deleteApiKey,
  hasApiKey,
  readApiKey,
  writeApiKey,
} from "./apiKey.ts"
import { makeNodeDatabase } from "../node/makeNodeDatabase.ts"

test("write, read and delete provider api key", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-api-key-"))

  try {
    const database = makeNodeDatabase({ root })

    assert.equal(unwrap(await hasApiKey(database, "deepseek")), false)

    unwrap(await writeApiKey(database, "deepseek", "  sk-test  \n"))
    assert.equal(unwrap(await hasApiKey(database, "deepseek")), true)
    assert.equal(unwrap(await readApiKey(database, "deepseek")), "sk-test")

    assert.equal(unwrap(await deleteApiKey(database, "deepseek")), true)
    assert.equal(unwrap(await hasApiKey(database, "deepseek")), false)
    assert.equal(unwrap(await deleteApiKey(database, "deepseek")), false)

    const result = await readApiKey(database, "deepseek")
    assert.equal(result.kind, "ErrorResult")
    assert.match(result.error.message, /api key not found/)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("writeApiKey rejects empty api key", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-api-key-"))

  try {
    const database = makeNodeDatabase({ root })

    const result = await writeApiKey(database, "deepseek", "   \n")
    assert.equal(result.kind, "ErrorResult")
    assert.match(result.error.message, /api key is empty/)
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

    assert.equal(unwrap(await hasApiKey(database, "deepseek")), false)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
