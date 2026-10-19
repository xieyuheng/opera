import assert from "node:assert/strict"
import { test } from "node:test"

import { HttpRequestError } from "@windbell/http.ts"
import { z, ZodError } from "zod"

import type { ModelInterpretEvent } from "../model/index.ts"
import { AssistantSign } from "../sign/index.ts"
import { makeModelErrorFromUnknown, withModelErrorEvent } from "./modelError.ts"

test("makeModelErrorFromUnknown normalizes http errors", () => {
  const error = new HttpRequestError({
    method: "POST",
    path: "/chat/completions",
    status: 429,
    detail: "rate limited",
  })

  const modelError = makeModelErrorFromUnknown(error)

  assert.equal(modelError.type, "http")
  assert.equal(modelError.status, 429)
  assert.match(modelError.message, /rate limited/)
})

test("makeModelErrorFromUnknown normalizes abort and network errors", () => {
  const abortError = Object.assign(new Error("aborted"), {
    name: "AbortError",
  })
  const networkError = new TypeError("fetch failed")

  assert.deepEqual(makeModelErrorFromUnknown(abortError), {
    type: "aborted",
    message: "aborted",
  })
  assert.deepEqual(makeModelErrorFromUnknown(networkError), {
    type: "network",
    message: "fetch failed",
  })
})

test("makeModelErrorFromUnknown normalizes response errors", () => {
  let zodError: unknown
  try {
    z.string().parse(123)
  } catch (error) {
    zodError = error
  }

  assert.ok(zodError instanceof ZodError)
  assert.equal(makeModelErrorFromUnknown(zodError).type, "invalid-response")
  assert.equal(
    makeModelErrorFromUnknown(new SyntaxError("invalid json")).type,
    "invalid-response",
  )
})

test("withModelErrorEvent turns thrown errors into error events", async () => {
  async function* events(): AsyncGenerator<ModelInterpretEvent> {
    yield { type: "sign", sign: AssistantSign("partial") }
    throw new TypeError("fetch failed")
  }

  const received: Array<ModelInterpretEvent> = []
  for await (const event of withModelErrorEvent(events())) {
    received.push(event)
  }

  assert.deepEqual(received, [
    { type: "sign", sign: AssistantSign("partial") },
    {
      type: "error",
      error: { type: "network", message: "fetch failed" },
    },
  ])
})
