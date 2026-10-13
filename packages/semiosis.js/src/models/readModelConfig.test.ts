import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { writeApiKey } from "../database/index.ts"
import { makeNodeDatabase } from "../node/makeNodeDatabase.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"
import { makeModel } from "./makeModel.ts"

test("DeepSeek.readModelConfig returns default config when model is not configured", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-read-model-config-"),
  )

  try {
    const database = makeNodeDatabase({ root })
    const config = await DeepSeek.readModelConfig(database, "deepseek-flash")

    assert.deepEqual(config, {
      name: "deepseek-flash",
      pinned: false,
      thinking: "enabled",
      reasoningEffort: "high",
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("OpenRouter.readModelConfig returns default config when model is not configured", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-read-model-config-"),
  )

  try {
    const database = makeNodeDatabase({ root })
    const config = await OpenRouter.readModelConfig(database, "openrouter/free")

    assert.deepEqual(config, {
      name: "openrouter/free",
      pinned: false,
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("makeModel uses default model config when models.json is missing", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-read-model-config-"),
  )

  try {
    const database = makeNodeDatabase({ root })
    await writeApiKey(database, "deepseek", "sk-test")

    const model = await makeModel(
      { providerName: "deepseek", name: "deepseek-flash" },
      { database },
    )

    assert.equal(model.providerName, "deepseek")
    assert.equal(model.name, "deepseek-flash")
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
