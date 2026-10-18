import assert from "node:assert/strict"
import { test } from "node:test"
import { ToolCallSign, ToolSign } from "../sign/index.ts"
import { makeToolRouter } from "./ToolRouter.ts"

const emptyObjectSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
}

test("ToolRouter.run converts handler errors into ToolOutputSign", async () => {
  const toolRouter = makeToolRouter()

  toolRouter.defineTool(
    ToolSign("fail", "Always fails.", emptyObjectSchema),
    () => {
      throw new Error("boom")
    },
  )

  const sign = await toolRouter.run(
    ToolCallSign({
      callId: "call-fail",
      name: "fail",
      arguments: "{}",
    }),
  )

  assert.equal(sign.kind, "ToolOutputSign")
  assert.equal(sign.callId, "call-fail")
  assert.match(sign.content, /boom/)
})

test("ToolRouter.run never rejects for missing tools", async () => {
  const toolRouter = makeToolRouter()

  const sign = await toolRouter.run(
    ToolCallSign({
      callId: "call-missing",
      name: "missing",
      arguments: "{}",
    }),
  )

  assert.equal(sign.kind, "ToolOutputSign")
  assert.equal(sign.callId, "call-missing")
  assert.match(sign.content, /unknown tool: missing/)
})

test("ToolRouter.run returns cancelled output when already aborted", async () => {
  const toolRouter = makeToolRouter()
  let handlerCalled = false

  toolRouter.defineTool(
    ToolSign("test", "Test tool.", emptyObjectSchema),
    () => {
      handlerCalled = true
      return "ok"
    },
  )

  const controller = new AbortController()
  controller.abort()

  const sign = await toolRouter.run(
    ToolCallSign({
      callId: "call-cancelled",
      name: "test",
      arguments: "{}",
    }),
    { signal: controller.signal },
  )

  assert.equal(handlerCalled, false)
  assert.equal(sign.kind, "ToolOutputSign")
  assert.equal(sign.callId, "call-cancelled")
  assert.match(sign.content, /\[cancelled\]/)
})

test("ToolRouter.run turns aborted handler errors into cancelled output", async () => {
  const toolRouter = makeToolRouter()
  const controller = new AbortController()

  toolRouter.defineTool(
    ToolSign("test", "Test tool.", emptyObjectSchema),
    async () => {
      controller.abort()
      throw new Error("boom")
    },
  )

  const sign = await toolRouter.run(
    ToolCallSign({
      callId: "call-cancelled",
      name: "test",
      arguments: "{}",
    }),
    { signal: controller.signal },
  )

  assert.equal(sign.kind, "ToolOutputSign")
  assert.equal(sign.callId, "call-cancelled")
  assert.match(sign.content, /\[cancelled\]/)
  assert.doesNotMatch(sign.content, /boom/)
})
