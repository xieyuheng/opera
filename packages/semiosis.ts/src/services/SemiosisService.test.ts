import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"

import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import type { LockService } from "@xieyuheng/lock.ts/lock"
import { makeBash } from "@xieyuheng/sh.ts/bash"
import { makePath } from "@xieyuheng/std.ts/path"
import { ok, unwrap } from "@xieyuheng/std.ts/result"

import { makeSemiosisService } from "./SemiosisService.ts"

test("makeSemiosisService manages workspaces and sessions", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-di-"))

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const semiosis = makeSemiosisService({
    fs: makeLocalFileSystem(),
    path,
    root,
    sh: makeBash(),
  })

  const workspace = unwrap(
    await semiosis.workspaces.ensure({
      name: "test",
      root: path.join(root, "workspace"),
    }),
  )

  const session = unwrap(
    await semiosis.sessions.make({
      workspaceId: workspace.id,
      title: "test",
    }),
  )

  assert.equal(session.context.length, 2)
  assert.equal(session.context[0]?.kind, "ToolSign")
  assert.equal(session.context[1]?.kind, "PersonaSign")

  const sessions = unwrap(
    await semiosis.sessions.list({
      workspaceId: workspace.id,
    }),
  )

  assert.equal(sessions.length, 1)
  assert.equal(sessions[0]?.id, session.id)

  unwrap(await semiosis.dustbin.sessions.trash(session.id))
  assert.equal(
    unwrap(await semiosis.sessions.list({ workspaceId: workspace.id })).length,
    0,
  )

  const dustbin = unwrap(
    await semiosis.dustbin.sessions.list({
      workspaceId: workspace.id,
    }),
  )

  assert.equal(dustbin.length, 1)
})

test("makeSemiosisService propagates a lock service to sessions", async (t) => {
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

  const semiosis = makeSemiosisService({
    fs: makeLocalFileSystem(),
    path,
    root,
    sh: makeBash(),
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

test("makeSemiosisService creates a file lock from lockRoot", async (t) => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-lock-root-"))

  t.after(async () => {
    await fs.rm(root, { recursive: true, force: true })
  })

  const path = makePath(Os.platform() === "win32" ? "win32" : "posix")
  const lockRoot = path.join(root, "locks")
  const semiosis = makeSemiosisService({
    fs: makeLocalFileSystem(),
    path,
    root,
    sh: makeBash(),
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
