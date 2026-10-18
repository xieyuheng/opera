import process from "node:process"
import { makePath } from "@windbell/std.ts/path"
import { makeLocalFileSystem } from "@windbell/fs.ts/local-fs"
import { makeDatabase } from "./index.ts"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { UserSign } from "../sign/index.ts"
import { unwrap } from "@windbell/std.ts/result"

test("SessionStore stores turns and slices context by sequence", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-turn-"))

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

    const signs = unwrap(
      await database.sessions.sliceContextBySequence(session.id, 0, 1),
    )
    assert.deepEqual(
      signs.map((sign) => sign.kind),
      ["UserSign"],
    )

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
