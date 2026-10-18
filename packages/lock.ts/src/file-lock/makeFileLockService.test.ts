import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import { makePath } from "@windbell/std.ts/path"
import { unwrap } from "@windbell/std.ts/result"
import { makeFileLockService } from "./makeFileLockService.ts"

test("file lock excludes concurrent users and supports release", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-lock-"))
  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const lock = makeFileLockService({
    fs: makeLocalFileSystem(),
    path,
    root,
  })

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const first = unwrap(await lock.tryLock("session:test", { ttlMs: 60_000 }))
  assert.notEqual(first, undefined)

  const second = unwrap(await lock.tryLock("session:test", { ttlMs: 60_000 }))
  assert.equal(second, undefined)

  await first?.release()

  const third = unwrap(await lock.tryLock("session:test", { ttlMs: 60_000 }))
  assert.notEqual(third, undefined)
  await third?.release()
})

test("file lock renew refreshes ttl", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-lock-renew-"))
  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const lock = makeFileLockService({
    fs: makeLocalFileSystem(),
    path,
    root,
  })

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const first = unwrap(await lock.tryLock("session:renew", { ttlMs: 60_000 }))
  assert.notEqual(first, undefined)

  const lockPath = Path.join(root, "session_renew.lock")
  await fs.utimes(lockPath, 0, 0)
  const before = await fs.stat(lockPath)

  await first?.renew()
  const after = await fs.stat(lockPath)
  assert.ok(after.mtimeMs > before.mtimeMs)

  const second = unwrap(await lock.tryLock("session:renew", { ttlMs: 60_000 }))
  assert.equal(second, undefined)

  await first?.release()
})

test("file lock can be taken over after ttl", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-lock-ttl-"))
  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const lock = makeFileLockService({
    fs: makeLocalFileSystem(),
    path,
    root,
  })

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const first = unwrap(await lock.tryLock("session:ttl", { ttlMs: 60_000 }))
  assert.notEqual(first, undefined)

  await fs.utimes(Path.join(root, "session_ttl.lock"), 0, 0)

  const second = unwrap(await lock.tryLock("session:ttl", { ttlMs: 60_000 }))
  assert.notEqual(second, undefined)
  await second?.release()
})
