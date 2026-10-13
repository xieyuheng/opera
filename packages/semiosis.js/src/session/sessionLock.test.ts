import process from "node:process"
import { makePath } from "@windbell/std.js/path"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makeDatabase } from "../database/index.ts"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
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
