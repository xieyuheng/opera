import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makeLocalBash } from "@windbell/sh.js/local-sh"
import { makePath } from "@windbell/std.js/path"
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
