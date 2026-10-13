import assert from "node:assert/strict"
import { test } from "node:test"
import type { Model } from "../model/index.ts"
import { AssistantSign, type Sign } from "../sign/index.ts"
import { generateTitle } from "./generateTitle.ts"

function makeModel(
  interpret: (input: Array<Sign>) => Array<Sign> | Promise<Array<Sign>>,
): Model {
  return {
    providerName: "test",
    name: "test",
    interpret: async function* (input) {
      for (const sign of await interpret(input)) {
        yield { type: "sign", sign }
      }
    },
  }
}

test("generateTitle returns ok with trimmed assistant content", async () => {
  const model = makeModel(async () => [AssistantSign("  Hello title  ")])

  const result = await generateTitle({
    model,
    context: [],
  })

  assert.deepEqual(result, { kind: "ok", title: "Hello title" })
})

test("generateTitle returns empty when no assistant sign is present", async () => {
  const model = makeModel(async () => [])

  const result = await generateTitle({
    model,
    context: [],
  })

  assert.deepEqual(result, { kind: "empty" })
})

test("generateTitle returns error from model error event", async () => {
  const model: Model = {
    providerName: "test",
    name: "test",
    interpret: async function* () {
      yield {
        type: "error",
        error: {
          type: "http",
          message: "rate limited",
          status: 429,
        },
      }
    },
  }

  const result = await generateTitle({
    model,
    context: [],
  })

  assert.deepEqual(result, {
    kind: "error",
    error: {
      type: "http",
      message: "rate limited",
      status: 429,
    },
  })
})
