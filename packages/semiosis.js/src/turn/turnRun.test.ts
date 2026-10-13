import assert from "node:assert/strict"
import { test } from "node:test"
import { ok } from "@windbell/std.js/result"
import { makeAgent } from "../agent/index.ts"
import type { SessionStore } from "../database/index.ts"
import type { Model, ModelError } from "../model/index.ts"
import { UserSign } from "../sign/index.ts"
import { makeToolRouter } from "../tool/index.ts"
import type { Turn } from "./Turn.ts"
import { isRetryableModelError, turnRun } from "./turnRun.ts"

function makeTurn(inputPersisted: boolean): Turn {
  return {
    id: "turn-1",
    sessionId: "session-1",
    status: "pending",
    model: { providerName: "test", name: "test" },
    inputHash: "hash",
    inputPersisted,
    startSequence: 0,
    endSequence: 0,
    createdAt: 0,
    updatedAt: 0,
  }
}

function makeErrorModel(error: ModelError): Model {
  return {
    providerName: "test",
    name: "test",
    interpret: async function* () {
      yield { type: "error", error }
    },
  }
}

test("isRetryableModelError classifies normalized errors", () => {
  assert.equal(
    isRetryableModelError({ type: "http", message: "", status: 429 }),
    true,
  )
  assert.equal(
    isRetryableModelError({ type: "http", message: "", status: 500 }),
    true,
  )
  assert.equal(
    isRetryableModelError({ type: "http", message: "", status: 400 }),
    false,
  )
  assert.equal(isRetryableModelError({ type: "network", message: "" }), true)
  assert.equal(isRetryableModelError({ type: "aborted", message: "" }), false)
})

test("turnRun turns a first model error into a failed turn event", async () => {
  const storedTurns: Array<Turn> = []
  const sessions = {
    async sliceContextBySequence() {
      return ok([])
    },
    async nextSignSequence() {
      return ok(0)
    },
    async putTurn(turn: Turn) {
      storedTurns.push(turn)
      return ok(undefined)
    },
  } as unknown as SessionStore
  const agent = makeAgent({
    model: makeErrorModel({ type: "network", message: "fetch failed" }),
    toolRouter: makeToolRouter(),
    getContext: async () => [],
    appendContext: async () => {},
  })
  const turn = makeTurn(false)
  const events = []

  for await (const event of turnRun({
    sessions,
    agent,
    turn,
    input: [UserSign("hello")],
  })) {
    events.push(event)
  }

  assert.deepEqual(events, [
    {
      type: "error",
      message: "fetch failed",
      retryable: true,
      inputPersisted: false,
    },
  ])
  assert.equal(storedTurns.at(-1)?.status, "failed")
  assert.deepEqual(storedTurns.at(-1)?.error, { message: "fetch failed" })
})

test("turnRun preserves inputPersisted for a later model error", async () => {
  const sessions = {
    async sliceContextBySequence() {
      return ok([])
    },
    async nextSignSequence() {
      return ok(0)
    },
    async putTurn() {
      return ok(undefined)
    },
  } as unknown as SessionStore
  const agent = makeAgent({
    model: makeErrorModel({
      type: "http",
      message: "rate limited",
      status: 429,
    }),
    toolRouter: makeToolRouter(),
    getContext: async () => [],
    appendContext: async () => {},
  })
  const events = []

  for await (const event of turnRun({
    sessions,
    agent,
    turn: makeTurn(true),
    input: [],
  })) {
    events.push(event)
  }

  assert.deepEqual(events, [
    {
      type: "error",
      message: "rate limited",
      retryable: true,
      inputPersisted: true,
    },
  ])
})
