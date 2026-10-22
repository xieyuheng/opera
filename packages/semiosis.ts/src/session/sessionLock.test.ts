import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { makePath } from "@xieyuheng/std.ts/path"

import { makeDatabase } from "../database/index.ts"
import { acquireSessionLease } from "./sessionLock.ts"

test("session lock leases coordinate a local database", async (t) => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "semiosis-session-lock-"),
  )

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const database = makeDatabase({
    fs: makeLocalFileSystem(),
    path: makePath(process.platform === "win32" ? "win32" : "posix"),
    root: Path.join(root, "database"),
  })
  const lockRoot = Path.join(root, "locks")

  const first = await acquireSessionLease({
    database,
    sessionId: "session-1" as never,
    lockRoot,
  })

  assert.deepEqual(await fs.readdir(lockRoot), ["session-1.lock"])

  await assert.rejects(
    acquireSessionLease({
      database,
      sessionId: "session-1" as never,
      lockRoot,
    }),
    /session is already running/,
  )

  await first.release()

  const second = await acquireSessionLease({
    database,
    sessionId: "session-1" as never,
    lockRoot,
  })
  await second.release()
})
