import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { makePath } from "@xieyuheng/std.ts/path"
import { unwrap } from "@xieyuheng/std.ts/result"

import { makeDatabase } from "../database/index.ts"
import { pinModel } from "./pinModel.ts"
import { setDefaultModel } from "./setDefaultModel.ts"

test("setDefaultModel writes provider defaultModel", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-set-default-model-"),
  )

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

    assert.deepEqual(unwrap(await database.providers.get("deepseek")), {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com",
      defaultModel: "deepseek-flash",
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("setDefaultModel accepts model that is not pinned", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-set-default-model-"),
  )

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
    await setDefaultModel(database, "deepseek", "deepseek-flash")

    assert.deepEqual(unwrap(await database.providers.get("deepseek")), {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com",
      defaultModel: "deepseek-flash",
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("setDefaultModel rejects unsupported provider", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-set-default-model-"),
  )

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await assert.rejects(
      () => setDefaultModel(database, "unknown", "deepseek-flash"),
      /unsupported provider/,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
