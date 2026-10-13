import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeNodeDatabase } from "../database/index.ts"
import { acquireSessionLease } from "./sessionLock.ts"

test("session lock leases coordinate a local database", async (t) => {
  const root = await fs.mkdtemp(
    Path.join(Os.tmpdir(), "semiosis-session-lock-"),
  )

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const database = makeNodeDatabase({
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
