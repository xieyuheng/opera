import assert from "node:assert/strict"
import { test } from "node:test"

import type { LockService } from "@windbell/lock.ts/lock"
import { makeBash } from "@windbell/sh.ts/bash"
import { ok } from "@windbell/std.ts/result"

import type { Database } from "../database/Database.ts"
import { makeSessionService } from "./SessionService.ts"

test("sessions interpret locks the session and rejects concurrent runs", async () => {
  let releaseGet: () => void = () => {}
  const gate = new Promise<void>((resolve) => {
    releaseGet = resolve
  })
  const tryLockCalls: Array<{ key: string; ttlMs: number | undefined }> = []
  let held = false
  let releaseCalls = 0

  const lock: LockService = {
    async tryLock(key, options) {
      tryLockCalls.push({ key, ttlMs: options?.ttlMs })

      if (held) return ok(undefined)

      held = true
      return ok({
        async renew() {},
        async release() {
          held = false
          releaseCalls += 1
        },
      })
    },
  }

  const database = {
    sessions: {
      async get() {
        await gate
        return ok(undefined)
      },
    },
    workspaces: {
      async get() {
        return ok(undefined)
      },
    },
  } as unknown as Database

  const sessions = makeSessionService({
    database,
    sh: makeBash(),
    lock,
  })

  const interpretOptions = {
    sessionId: "session-1" as never,
    model: { providerName: "mock", name: "mock" },
    turnId: "turn-1",
    input: [],
  }

  const first = sessions.interpret(interpretOptions)[Symbol.asyncIterator]()
  const firstNext = first.next()

  await waitFor(() => tryLockCalls.length === 1 && held)

  assert.deepEqual(tryLockCalls[0], {
    key: "session:session-1",
    ttlMs: 60_000,
  })

  const second = sessions.interpret(interpretOptions)[Symbol.asyncIterator]()
  const secondEvent = await second.next()

  assert.equal(secondEvent.done, false)
  assert.deepEqual(secondEvent.value, {
    type: "error",
    message: "session is already running",
    retryable: false,
    inputPersisted: false,
  })
  assert.equal(tryLockCalls.length, 2)
  assert.deepEqual(tryLockCalls[1], {
    key: "session:session-1",
    ttlMs: 60_000,
  })

  releaseGet()
  await assert.rejects(firstNext, /session not found: session-1/)
  assert.equal(held, false)
  assert.equal(releaseCalls, 1)
})

async function waitFor(predicate: () => boolean): Promise<void> {
  const deadline = Date.now() + 1_000

  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("timed out")
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}
