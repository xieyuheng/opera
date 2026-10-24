import assert from "node:assert/strict"
import { test } from "node:test"

import { uuid } from "./uuid.ts"

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

test("uuid returns a version 4 uuid", () => {
  assert.match(uuid(), uuidV4Pattern)
})

test("uuid fallback keeps the version 4 uuid format", () => {
  const originalRandomUUID = globalThis.crypto.randomUUID

  try {
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: undefined,
    })

    assert.match(uuid(), uuidV4Pattern)
  } finally {
    Object.defineProperty(globalThis.crypto, "randomUUID", {
      configurable: true,
      value: originalRandomUUID,
    })
  }
})
