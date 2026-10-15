import assert from "node:assert/strict"
import { test } from "node:test"
import { makeBash } from "@windbell/sh.js/bash"
import { ok, unwrap } from "@windbell/std.js/result"
import type { Database } from "../database/index.ts"
import type { Turn } from "../turn/index.ts"
import { makeSessionService } from "./SessionService.ts"

test("SessionService.getTotalUsage sums turn usage", async () => {
  const first = {
    input: 1_000,
    output: 100,
    cacheRead: 400,
    cacheMiss: 600,
    cacheWrite: 0,
    total: 1_100,
    raw: [],
  }
  const second = {
    input: 2_000,
    output: 200,
    cacheRead: 1_500,
    cacheMiss: 400,
    cacheWrite: 100,
    total: 2_200,
    raw: [],
  }
  const turns = [
    { usage: first },
    { usage: second },
    {},
  ] as unknown as Array<Turn>
  const database = {
    sessions: {
      async get() {
        return ok({})
      },
      async listTurns() {
        return ok(turns)
      },
    },
  } as unknown as Database
  const sessions = makeSessionService({
    database,
    sh: makeBash(),
  })

  const total = unwrap(
    await sessions.getTotalUsage({
      sessionId: "session-1" as never,
    }),
  )

  assert.deepEqual(total, {
    input: 3_000,
    output: 300,
    cacheRead: 1_900,
    cacheMiss: 1_000,
    cacheWrite: 100,
    total: 3_300,
  })
})
