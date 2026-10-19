import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import { makePath } from "@windbell/std.ts/path"

import { makeDatabase } from "../database/index.ts"
import { readProviderConfig } from "./readProviderConfig.ts"

test("readProviderConfig returns default config without stored file", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-read-provider-config-"),
  )

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    assert.deepEqual(await readProviderConfig(database, "deepseek"), {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com",
      defaultModel: "deepseek-flash",
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("readProviderConfig returns stored config when file exists", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-read-provider-config-"),
  )

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await database.providers.put("deepseek", {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com/v1",
      defaultModel: "deepseek-flash",
    })

    assert.deepEqual(await readProviderConfig(database, "deepseek"), {
      name: "deepseek",
      baseUrl: "https://api.deepseek.com/v1",
      defaultModel: "deepseek-flash",
    })
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("readProviderConfig rejects unknown provider", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-read-provider-config-"),
  )

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await assert.rejects(
      () => readProviderConfig(database, "unknown"),
      /unknown provider/,
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
