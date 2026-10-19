import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import { makePath } from "@windbell/std.ts/path"
import { unwrap } from "@windbell/std.ts/result"

import { makeDatabase } from "../database/index.ts"
import type { Database } from "../database/index.ts"
import * as DeepSeek from "../providers/deepseek/index.ts"
import * as OpenRouter from "../providers/openrouter/index.ts"
import { isModelPinned } from "./isModelPinned.ts"
import { pinModel } from "./pinModel.ts"
import { setDefaultModel } from "./setDefaultModel.ts"
import { unpinModel } from "./unpinModel.ts"

test("unpinModel marks a pinned model as unpinned", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-pin-model-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await pinModel(database, "deepseek", "deepseek-flash")

    const result = await unpinModel(database, "deepseek", "deepseek-flash")

    assert.equal(result, true)
    assert.equal(
      await isModelPinned(database, "deepseek", "deepseek-flash"),
      false,
    )
    assert.deepEqual(
      (await readModelConfigsFile(database, "deepseek"))["deepseek-flash"],
      { pinned: false },
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("unpinModel preserves model config", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-pin-model-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await writeModelConfigsFile(database, "deepseek", {
      "deepseek-flash": {
        pinned: true,
        thinking: "disabled",
        reasoningEffort: "low",
      },
    })

    const result = await unpinModel(database, "deepseek", "deepseek-flash")

    assert.equal(result, true)
    assert.deepEqual(
      (await readModelConfigsFile(database, "deepseek"))["deepseek-flash"],
      {
        pinned: false,
        thinking: "disabled",
        reasoningEffort: "low",
      },
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("unpinModel does not clear matching default model", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-pin-model-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    unwrap(
      await database.providers.put("deepseek", {
        name: "deepseek",
        baseUrl: "https://api.deepseek.com",
        defaultModel: null,
      }),
    )
    await pinModel(database, "deepseek", "deepseek-flash")
    await setDefaultModel(database, "deepseek", "deepseek-flash")

    const result = await unpinModel(database, "deepseek", "deepseek-flash")

    assert.equal(result, true)
    assert.deepEqual(unwrap(await database.providers.get("deepseek")), {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com",
      defaultModel: "deepseek-flash",
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("unpinModel returns false when model is already unpinned", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-pin-model-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await writeModelConfigsFile(database, "deepseek", {
      "deepseek-flash": {
        pinned: false,
        thinking: "enabled",
        reasoningEffort: "high",
      },
    })

    const result = await unpinModel(database, "deepseek", "deepseek-flash")

    assert.equal(result, false)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("pinModel re-pins an unpinned model and preserves config", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-pin-model-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await writeModelConfigsFile(database, "deepseek", {
      "deepseek-flash": {
        pinned: false,
        thinking: "disabled",
        reasoningEffort: "low",
      },
    })

    await pinModel(database, "deepseek", "deepseek-flash")

    assert.equal(
      await isModelPinned(database, "deepseek", "deepseek-flash"),
      true,
    )
    assert.deepEqual(
      (await readModelConfigsFile(database, "deepseek"))["deepseek-flash"],
      {
        pinned: true,
        thinking: "disabled",
        reasoningEffort: "low",
      },
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("DeepSeek.makeModel accepts unpinned config", () => {
  const model = DeepSeek.makeModel({} as never, {
    name: "deepseek-flash",
    pinned: false,
    thinking: "enabled",
    reasoningEffort: "high",
  })

  assert.equal(model.name, "deepseek-flash")
})

test("OpenRouter.makeModel accepts unpinned config", () => {
  const model = OpenRouter.makeModel({} as never, {
    name: "openrouter/free",
    pinned: false,
  })

  assert.equal(model.name, "openrouter/free")
})

async function readModelConfigsFile(
  database: Database,
  providerName: string,
): Promise<Record<string, unknown>> {
  const path = Path.join(database.providersRoot, providerName, "models.json")
  const text = await fs.readFile(path, "utf8")
  return JSON.parse(text) as Record<string, unknown>
}

async function writeModelConfigsFile(
  database: Database,
  providerName: string,
  value: Record<string, unknown>,
): Promise<void> {
  const path = Path.join(database.providersRoot, providerName, "models.json")
  await fs.mkdir(Path.dirname(path), { recursive: true })
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}
