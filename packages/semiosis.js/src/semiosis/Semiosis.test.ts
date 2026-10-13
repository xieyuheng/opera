import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import type { LockService } from "@windbell/lock.js/lock"
import { makeLocalBash } from "@windbell/sh.js/local-sh"
import { makePath } from "@windbell/std.js/path"
import { ok } from "@windbell/std.js/result"
import { makeSemiosis } from "./Semiosis.ts"

test("makeSemiosis manages workspaces and sessions", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-di-"))

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const semiosis = makeSemiosis({
    fs: makeLocalFileSystem(),
    path,
    root,
    sh: makeLocalBash(),
  })

  const workspace = await semiosis.workspaces.ensure({
    name: "test",
    root: path.join(root, "workspace"),
  })

  const session = await semiosis.sessions.make({
    workspaceId: workspace.id,
    title: "test",
  })

  assert.equal(session.context.length, 2)
  assert.equal(session.context[0]?.kind, "ToolSign")
  assert.equal(session.context[1]?.kind, "PersonaSign")

  const sessions = await semiosis.sessions.list({
    workspaceId: workspace.id,
  })

  assert.equal(sessions.length, 1)
  assert.equal(sessions[0]?.id, session.id)

  await semiosis.dustbin.sessions.trash(session.id)
  assert.equal(
    (await semiosis.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )

  const dustbin = await semiosis.dustbin.sessions.list({
    workspaceId: workspace.id,
  })

  assert.equal(dustbin.length, 1)
})

test("makeSemiosis propagates a lock service to sessions", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-lock-"))

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const lockedKeys: Array<string> = []
  const lock: LockService = {
    async tryLock(key) {
      lockedKeys.push(key)
      return ok({
        async renew() {},
        async release() {},
      })
    },
  }

  const semiosis = makeSemiosis({
    fs: makeLocalFileSystem(),
    path,
    root,
    sh: makeLocalBash(),
    lock,
  })

  const iterator = semiosis.sessions
    .interpret({
      sessionId: "missing" as never,
      model: { providerName: "mock", name: "mock" },
      turnId: "turn-1",
      input: [],
    })
    [Symbol.asyncIterator]()

  await assert.rejects(iterator.next(), /session not found: missing/)
  assert.deepEqual(lockedKeys, ["session:missing"])
})

test("makeSemiosis creates a file lock from lockRoot", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-lock-root-"))

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const lockRoot = path.join(root, "locks")
  const semiosis = makeSemiosis({
    fs: makeLocalFileSystem(),
    path,
    root,
    sh: makeLocalBash(),
    lockRoot,
  })

  const iterator = semiosis.sessions
    .interpret({
      sessionId: "missing" as never,
      model: { providerName: "mock", name: "mock" },
      turnId: "turn-1",
      input: [],
    })
    [Symbol.asyncIterator]()

  await assert.rejects(iterator.next(), /session not found: missing/)

  const lockRootStat = await fs.stat(lockRoot)
  assert.equal(lockRootStat.isDirectory(), true)
  assert.deepEqual(await fs.readdir(lockRoot), [])
})
