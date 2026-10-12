import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import { makeNodeDatabase } from "./index.ts"
import { UserSign } from "../sign/index.ts"

test("SessionStore stores turns and slices context by sequence", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-turn-"))

  try {
    const database = makeNodeDatabase({ root })
    const workspace = await database.workspaces.make({
      name: "test",
      root: Path.join(root, "workspace"),
    })
    const session = await database.sessions.make({
      workspaceId: workspace.id,
      title: "test",
    })

    const sequence = await database.sessions.appendSign(
      session.id,
      UserSign("hello"),
    )
    assert.equal(sequence, 0)

    const signs = await database.sessions.sliceContextBySequence(
      session.id,
      0,
      1,
    )
    assert.deepEqual(
      signs.map((sign) => sign.kind),
      ["UserSign"],
    )

    const now = Date.now()
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
    })

    const turn = await database.sessions.getTurn(session.id, "turn-1")
    assert.equal(turn?.status, "completed")
    assert.equal(turn?.startSequence, 0)
    assert.equal(turn?.endSequence, 1)

    const turns = await database.sessions.listTurns(session.id)
    assert.deepEqual(
      turns.map((turn) => turn.id),
      ["turn-1"],
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})
