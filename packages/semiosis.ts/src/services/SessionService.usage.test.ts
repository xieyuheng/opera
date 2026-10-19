import assert from "node:assert/strict"
import { test } from "node:test"

import { makeBash } from "@windbell/sh.ts/bash"
import { ok, unwrap } from "@windbell/std.ts/result"

import type { Database } from "../database/index.ts"
import type { Turn, TurnStep } from "../turn/index.ts"
import { makeSessionService } from "./SessionService.ts"

test("SessionService.getUsage sums step usage and returns latest usage", async () => {
  const first = {
    input: 1_000,
    output: 100,
    cacheRead: 400,
    cacheMiss: 600,
    cacheWrite: 0,
    total: 1_100,
    raw: {},
  }
  const second = {
    input: 2_000,
    output: 200,
    cacheRead: 1_500,
    cacheMiss: 400,
    cacheWrite: 100,
    total: 2_200,
    raw: {},
  }
  const turns = [
    { id: "turn-1", sessionId: "session-1" },
    { id: "turn-2", sessionId: "session-1" },
  ] as unknown as Array<Turn>
  const stepsByTurn: Record<string, Array<TurnStep>> = {
    "turn-1": [
      {
        sessionId: "session-1",
        turnId: "turn-1",
        sequenceNumber: 1,
        status: "completed",
        usage: first,
        createdAt: 0,
        updatedAt: 0,
      },
    ],
    "turn-2": [
      {
        sessionId: "session-1",
        turnId: "turn-2",
        sequenceNumber: 1,
        status: "completed",
        usage: second,
        createdAt: 0,
        updatedAt: 0,
      },
    ],
  }
  const database = {
    sessions: {
      async get() {
        return ok({})
      },
      async listTurns() {
        return ok(turns)
      },
      async listSteps(_sessionId: string, turnId: string) {
        return ok(stepsByTurn[turnId] ?? [])
      },
    },
  } as unknown as Database
  const sessions = makeSessionService({
    database,
    sh: makeBash(),
  })

  const usage = unwrap(
    await sessions.getUsage({
      sessionId: "session-1" as never,
    }),
  )

  assert.deepEqual(usage.totalUsage, {
    input: 3_000,
    output: 300,
    cacheRead: 1_900,
    cacheMiss: 1_000,
    cacheWrite: 100,
    total: 3_300,
  })
  assert.deepEqual(usage.latestUsage, second)
})
