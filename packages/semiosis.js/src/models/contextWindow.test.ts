import assert from "node:assert/strict"
import { test } from "node:test"
import { modelEntryContextWindow } from "./contextWindow.ts"
import type { ModelEntry } from "./ModelEntry.ts"

test("modelEntryContextWindow reads deepseek context_window", () => {
  const entry = {
    providerName: "deepseek",
    info: { context_window: 128_000 },
  } as unknown as ModelEntry

  assert.equal(modelEntryContextWindow(entry), 128_000)
})

test("modelEntryContextWindow reads openrouter context_length", () => {
  const entry = {
    providerName: "openrouter",
    info: {
      context_length: 200_000,
      top_provider: { context_length: 100_000 },
    },
  } as unknown as ModelEntry

  assert.equal(modelEntryContextWindow(entry), 200_000)
})

test("modelEntryContextWindow falls back to top provider context", () => {
  const entry = {
    providerName: "openrouter",
    info: {
      context_length: undefined,
      top_provider: { context_length: 64_000 },
    },
  } as unknown as ModelEntry

  assert.equal(modelEntryContextWindow(entry), 64_000)
})
