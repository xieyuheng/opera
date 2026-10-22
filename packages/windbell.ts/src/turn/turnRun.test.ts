import assert from "node:assert/strict"
import { test } from "node:test"

import { ok } from "@xieyuheng/std.ts/result"

import { makeAgent } from "../agent/index.ts"
import type { SessionStore } from "../database/index.ts"
import type { Model, ModelError } from "../model/index.ts"
import { AssistantSign, UserSign } from "../sign/index.ts"
import { makeToolRouter } from "../tool/index.ts"
import type { Turn, TurnStep } from "./Turn.ts"
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

function makeSessionStore(): {
  sessions: SessionStore
  storedTurns: Array<Turn>
  storedSteps: Map<number, TurnStep>
} {
  const storedTurns: Array<Turn> = []
  const storedSteps = new Map<number, TurnStep>()
  let nextSequence = 1

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
    async nextStepSequence() {
      return ok(nextSequence++)
    },
    async putStep(step: TurnStep) {
      storedSteps.set(step.sequenceNumber, { ...step })
      return ok(undefined)
    },
  } as unknown as SessionStore

  return { sessions, storedTurns, storedSteps }
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
  const { sessions, storedTurns, storedSteps } = makeSessionStore()
  const agent = makeAgent({
    model: makeErrorModel({ type: "network", message: "fetch failed" }),
    toolRouter: makeToolRouter(),
    getContext: async () => [],
    appendContext: async () => {},
  })
  const events = []

  for await (const event of turnRun({
    sessions,
    agent,
    turn: makeTurn(false),
    input: [UserSign("hello")],
  })) {
    events.push(event)
  }

  assert.deepEqual(events, [
    { type: "sign", sign: UserSign("hello") },
    {
      type: "error",
      message: "fetch failed",
      retryable: true,
      inputPersisted: false,
    },
  ])
  assert.equal(storedTurns.at(-1)?.status, "failed")
  assert.deepEqual(storedTurns.at(-1)?.error, { message: "fetch failed" })

  const step = storedSteps.get(1)
  assert.equal(step?.status, "failed")
  assert.equal(step?.usage, undefined)
  assert.deepEqual(step?.error, { message: "fetch failed" })
})

test("turnRun forwards and persists usage", async () => {
  const { sessions, storedSteps } = makeSessionStore()
  const raw = { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 }
  const usage = {
    input: 10,
    output: 2,
    cacheRead: 4,
    cacheMiss: 6,
    cacheWrite: 0,
    total: 12,
    raw,
  }
  const model: Model = {
    providerName: "test",
    name: "test",
    interpret: async function* () {
      yield { type: "usage", usage }
      yield { type: "sign", sign: AssistantSign("answer") }
    },
  }
  const agent = makeAgent({
    model,
    toolRouter: makeToolRouter(),
    getContext: async () => [],
    appendContext: async () => {},
  })
  const events = []

  for await (const event of turnRun({
    sessions,
    agent,
    turn: makeTurn(false),
    input: [UserSign("hello")],
  })) {
    events.push(event)
  }

  assert.deepEqual(events, [
    { type: "sign", sign: UserSign("hello") },
    { type: "usage", usage },
    { type: "sign", sign: AssistantSign("answer") },
  ])

  const step = storedSteps.get(1)
  assert.equal(step?.status, "completed")
  assert.deepEqual(step?.usage, usage)
  assert.equal(step?.completedAt !== undefined, true)
})

test("turnRun preserves inputPersisted for a later model error", async () => {
  const { sessions, storedSteps } = makeSessionStore()
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
  assert.equal(storedSteps.get(1)?.status, "failed")
})
