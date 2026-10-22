import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { makePath } from "@xieyuheng/std.ts/path"

import { makeDatabase } from "../database/index.ts"
import { listModelEntries } from "./listModelEntries.ts"
import { pinModel } from "./pinModel.ts"
import { unpinModel } from "./unpinModel.ts"

test("listModelEntries sorts pinned models before unpinned models", async () => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "windbell-list-model-entries-"),
  )

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })

    await pinModel(database, "deepseek", "deepseek-model-a")
    await unpinModel(database, "deepseek", "deepseek-model-a")
    await pinModel(database, "deepseek", "deepseek-model-z")

    assert.deepEqual(await summary(database), [
      {
        providerName: "deepseek",
        name: "deepseek-model-z",
        pinned: true,
        isDefault: false,
        configPinned: true,
      },
      {
        providerName: "deepseek",
        name: "deepseek-model-a",
        pinned: false,
        isDefault: false,
        configPinned: false,
      },
    ])

    await pinModel(database, "deepseek", "deepseek-model-a")

    assert.deepEqual(
      (await summary(database)).map((entry) => entry.name),
      ["deepseek-model-a", "deepseek-model-z"],
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

async function summary(database: ReturnType<typeof makeDatabase>) {
  const entries = await listModelEntries(database, "deepseek")

  return entries.map((entry) => ({
    providerName: entry.providerName,
    name: entry.name,
    pinned: entry.pinned,
    isDefault: entry.isDefault,
    configPinned: entry.config?.pinned,
  }))
}
