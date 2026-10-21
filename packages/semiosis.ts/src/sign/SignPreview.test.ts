import assert from "node:assert/strict"
import { test } from "node:test"

import { UserSign } from "./Sign.ts"
import { makeSignPreview, signPreviewContentMaxLength } from "./SignPreview.ts"

test("makeSignPreview truncates normalized content", () => {
  const preview = makeSignPreview(UserSign("hello\n\n  world"))

  assert.deepEqual(preview, {
    kind: "UserSign",
    truncatedContent: "hello world",
  })
})

test("makeSignPreview respects the content limit", () => {
  const preview = makeSignPreview(
    UserSign("a".repeat(signPreviewContentMaxLength + 20)),
  )

  assert.equal(preview.truncatedContent.length, signPreviewContentMaxLength)
  assert.equal(preview.truncatedContent.at(-1), "…")
})
