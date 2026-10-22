import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import process from "node:process"
import { test } from "node:test"

import { makeLocalFileSystem } from "@xieyuheng/fs.ts/local-fs"
import { makePath } from "@xieyuheng/std.ts/path"
import { unwrap } from "@xieyuheng/std.ts/result"

import { UserSign } from "../sign/index.ts"
import { makeDatabase } from "./index.ts"

test("SessionStore stores turns and slices context by sequence", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-turn-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })
    const workspace = unwrap(
      await database.workspaces.make({
        name: "test",
        root: Path.join(root, "workspace"),
      }),
    )
    const session = unwrap(
      await database.sessions.make({
        workspaceId: workspace.id,
        title: "test",
      }),
    )

    const sequence = unwrap(
      await database.sessions.appendSign(session.id, UserSign("hello")),
    )
    assert.equal(sequence, 0)

    unwrap(await database.sessions.appendSign(session.id, UserSign("world")))

    const signs = unwrap(
      await database.sessions.sliceContextBySequence(session.id, 0, 1),
    )
    assert.deepEqual(
      signs.map((sign) => sign.kind),
      ["UserSign"],
    )

    const tail = unwrap(await database.sessions.getContextTail(session.id, 1))
    assert.deepEqual(tail, [UserSign("world")])

    const emptyTail = unwrap(
      await database.sessions.getContextTail(session.id, 0),
    )
    assert.deepEqual(emptyTail, [])

    const now = Date.now()
    unwrap(
      await database.sessions.putTurn({
        id: "turn-1",
        sessionId: session.id,
        status: "completed",
        model: { providerName: "mock", name: "test" },
        inputHash: "hash",
        inputPersisted: true,
        startSequence: 0,
        endSequence: 1,
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      }),
    )

    const turn = unwrap(await database.sessions.getTurn(session.id, "turn-1"))
    assert.equal(turn?.status, "completed")
    assert.equal(turn?.startSequence, 0)
    assert.equal(turn?.endSequence, 1)

    const turns = unwrap(await database.sessions.listTurns(session.id))
    assert.deepEqual(
      turns.map((turn) => turn.id),
      ["turn-1"],
    )

    unwrap(
      await database.sessions.putStep({
        sessionId: session.id,
        turnId: "turn-1",
        sequenceNumber: 1,
        status: "completed",
        usage: {
          input: 10,
          output: 2,
          cacheRead: 4,
          cacheMiss: 6,
          cacheWrite: 0,
          total: 12,
          raw: {},
        },
        createdAt: now,
        updatedAt: now,
        completedAt: now,
      }),
    )

    const steps = unwrap(
      await database.sessions.listSteps(session.id, "turn-1"),
    )
    assert.equal(steps.length, 1)
    assert.equal(steps[0]?.sequenceNumber, 1)
    assert.equal(steps[0]?.usage?.input, 10)

    const nextStepSequence = unwrap(
      await database.sessions.nextStepSequence(session.id, "turn-1"),
    )
    assert.equal(nextStepSequence, 2)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("SessionStore lists session pages by updatedAt descending", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "windbell-page-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })
    const workspace = unwrap(
      await database.workspaces.make({
        name: "page-test",
        root: Path.join(root, "workspace"),
      }),
    )

    const sessionA = unwrap(
      await database.sessions.make({
        workspaceId: workspace.id,
        title: "a",
      }),
    )
    const sessionB = unwrap(
      await database.sessions.make({
        workspaceId: workspace.id,
        title: "b",
      }),
    )
    const sessionC = unwrap(
      await database.sessions.make({
        workspaceId: workspace.id,
        title: "c",
      }),
    )

    unwrap(
      await database.sessions.put({
        ...sessionA,
        updatedAt: 100,
      }),
    )
    unwrap(
      await database.sessions.put({
        ...sessionB,
        updatedAt: 200,
      }),
    )
    unwrap(
      await database.sessions.put({
        ...sessionC,
        updatedAt: 200,
      }),
    )

    const expectedOrder = [sessionB, sessionC]
      .sort((a, b) => (a.id === b.id ? 0 : a.id < b.id ? 1 : -1))
      .map((session) => session.id)

    const firstPage = unwrap(
      await database.sessions.listPage({
        workspaceId: workspace.id,
        limit: 2,
      }),
    )

    assert.deepEqual(
      firstPage.indexes.map((session) => session.id),
      expectedOrder,
    )
    assert.equal(firstPage.nextCursor?.updatedAt, 200)

    const secondPage = unwrap(
      await database.sessions.listPage({
        workspaceId: workspace.id,
        limit: 2,
        cursor: firstPage.nextCursor ?? undefined,
      }),
    )

    assert.deepEqual(
      secondPage.indexes.map((session) => session.id),
      [sessionA.id],
    )
    assert.equal(secondPage.nextCursor, null)
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
