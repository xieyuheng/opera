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
import { setDefaultProvider } from "./setDefaultProvider.ts"

test("setDefaultProvider writes settings.defaultProvider", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-set-default-provider-"),
  )

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await setDefaultProvider(database, "deepseek")

    assert.deepEqual(unwrap(await database.settings.get()), {
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
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await assert.rejects(
      () => setDefaultProvider(database, "unknown"),
      /unsupported provider/,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
