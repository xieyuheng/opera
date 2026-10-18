import process from "node:process"
import { makePath } from "@windbell/std.js/path"
import { makeLocalFileSystem } from "@windbell/fs.js/local-fs"
import { makeDatabase } from "../database/index.ts"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import Os from "node:os"
import Path from "node:path"
import { test } from "node:test"
import type { Model } from "../model/index.ts"
import {
  AssistantSign,
  ReasoningSign,
  ToolCallSign,
  ToolOutputSign,
  ToolSign,
  UserSign,
  isToolOutputSign,
  type Sign,
} from "../sign/index.ts"
import { makeToolRouter, type ToolRouter } from "../tool/index.ts"
import { makeAgentFromSession } from "../session/index.ts"
import { makeAgent, type Agent } from "./Agent.ts"
import {
  agentContinue,
  agentInterpret,
  type AgentInterpretEvent,
} from "./agentInterpret.ts"
import { repairOrphanToolCalls } from "./repairOrphanToolCalls.ts"
import { unwrap } from "@windbell/std.js/result"

const emptyObjectSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
}

function makeArrayModel(
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

const unusedModel: Model = makeArrayModel(async () => [])

function makeTestAgent(
  context: Array<Sign>,
  model: Model = unusedModel,
  toolRouter: ToolRouter = makeToolRouter(),
): Agent {
  return makeAgent({
    model,
    toolRouter,
    getContext: async () => context,
    appendContext: async (signs) => {
      context.push(...signs)
    },
  })
}

async function collectAgentInterpretSigns(
  events: AsyncIterable<AgentInterpretEvent>,
): Promise<Array<Sign>> {
  const signs: Array<Sign> = []

  for await (const event of events) {
    if (event.type !== "sign") continue

    signs.push(event.sign)
  }

  return signs
}

async function drainAgentInterpretEvents(
  events: AsyncIterable<AgentInterpretEvent>,
): Promise<void> {
  for await (const _event of events) {
    // drain
  }
}

test("repairOrphanToolCalls appends one output per orphan call", async () => {
  const context: Array<Sign> = [
    ToolCallSign({
      callId: "call-1",
      name: "bash",
      arguments: '{"command":"pwd"}',
    }),
    ToolCallSign({
      callId: "call-2",
      name: "bash",
      arguments: '{"command":"ls"}',
    }),
  ]
  const agent = makeTestAgent(context)

  const repairs = await repairOrphanToolCalls(agent)

  assert.deepEqual(
    repairs.map((repair) => repair.callId),
    ["call-1", "call-2"],
  )
  assert.equal(context.filter(isToolOutputSign).length, 2)
  assert.match(repairs[0]?.content ?? "", /interrupted/)
  assert.match(repairs[0]?.content ?? "", /partially executed/)

  const secondRepairs = await repairOrphanToolCalls(agent)
  assert.deepEqual(secondRepairs, [])
  assert.equal(context.filter(isToolOutputSign).length, 2)
})

test("repairOrphanToolCalls leaves complete tool calls alone", async () => {
  const context: Array<Sign> = [
    ToolCallSign({
      callId: "call-1",
      name: "bash",
      arguments: "{}",
    }),
    ToolOutputSign("call-1", "ok"),
  ]
  const agent = makeTestAgent(context)

  const repairs = await repairOrphanToolCalls(agent)

  assert.deepEqual(repairs, [])
  assert.equal(context.filter(isToolOutputSign).length, 1)
})

test("agentInterpret repairs orphan tool calls before appending input", async () => {
  const context: Array<Sign> = [
    ToolCallSign({
      callId: "call-orphan",
      name: "bash",
      arguments: '{"command":"pwd"}',
    }),
  ]
  let interpretedContext: Array<Sign> = []
  const model: Model = makeArrayModel(async (input) => {
    interpretedContext = [...input]
    return []
  })
  const agent = makeTestAgent(context, model)
  const yielded = await collectAgentInterpretSigns(
    agentInterpret(agent, [UserSign("next")]),
  )

  assert.deepEqual(
    yielded.map((sign) => sign.kind),
    ["ToolOutputSign", "UserSign"],
  )
  assert.deepEqual(
    context.map((sign) => sign.kind),
    ["ToolCallSign", "ToolOutputSign", "UserSign"],
  )
  assert.deepEqual(
    interpretedContext.map((sign) => sign.kind),
    ["ToolCallSign", "ToolOutputSign", "UserSign"],
  )
})

test("agentInterpret records a ToolOutputSign for every tool call", async () => {
  const toolRouter = makeToolRouter()
  toolRouter.defineTool(
    ToolSign("ok", "Succeeds.", emptyObjectSchema),
    () => "ok",
  )
  toolRouter.defineTool(ToolSign("fail", "Fails.", emptyObjectSchema), () => {
    throw new Error("tool exploded")
  })

  let turn = 0
  const model: Model = makeArrayModel(async () => {
    turn += 1
    if (turn === 1) {
      return [
        ToolCallSign({ callId: "call-ok", name: "ok", arguments: "{}" }),
        ToolCallSign({
          callId: "call-fail",
          name: "fail",
          arguments: "{}",
        }),
      ]
    }
    return []
  })
  const context: Array<Sign> = []
  const agent = makeTestAgent(context, model, toolRouter)

  await drainAgentInterpretEvents(agentInterpret(agent, [UserSign("run")]))

  const outputs = context.filter(isToolOutputSign)
  assert.deepEqual(
    outputs.map((output) => output.callId),
    ["call-ok", "call-fail"],
  )
  assert.match(outputs[1]?.content ?? "", /tool exploded/)
})

test("agentInterpret repairs persisted orphan tool calls and yields input", async () => {
  const root = await fs.mkdtemp(Path.join(Os.tmpdir(), "semiosis-repair-"))

  try {
    const database = makeDatabase({
      fs: makeLocalFileSystem(),
      path: makePath(process.platform === "win32" ? "win32" : "posix"),
      root,
    })
    const workspace = unwrap(
      await database.workspaces.make({
        name: "test",
        root: Path.join(root, "workspace"),
      }),
    )
    const session = unwrap(
      await database.sessions.make({
        workspaceId: workspace.id,
        title: "test",
      }),
    )

    unwrap(
      await database.sessions.appendSign(
        session.id,
        ToolCallSign({
          callId: "call-orphan",
          name: "bash",
          arguments: '{"command":"pwd"}',
        }),
      ),
    )

    let interpretedContext: Array<Sign> = []
    const model: Model = makeArrayModel(async (input) => {
      interpretedContext = [...input]
      return []
    })

    const agent = await makeAgentFromSession({
      database,
      sessionId: session.id,
      model,
      makeToolRouter: () => makeToolRouter(),
    })

    const before = unwrap(await database.sessions.get(session.id))
    assert.deepEqual(
      before?.context.map((sign) => sign.kind),
      ["ToolCallSign"],
    )

    const yielded = await collectAgentInterpretSigns(
      agentInterpret(agent, [UserSign("next")]),
    )

    assert.deepEqual(
      yielded.map((sign) => sign.kind),
      ["ToolOutputSign", "UserSign"],
    )
    assert.deepEqual(
      interpretedContext.map((sign) => sign.kind),
      ["ToolCallSign", "ToolOutputSign", "UserSign"],
    )

    const loaded = unwrap(await database.sessions.get(session.id))
    assert.deepEqual(
      loaded?.context.map((sign) => sign.kind),
      ["ToolCallSign", "ToolOutputSign", "UserSign"],
    )
  } finally {
    await fs.rm(root, { recursive: true, force: true })
  }
})

test("agentInterpret marks remaining tool calls cancelled after abort", async () => {
  const controller = new AbortController()
  const handlerCalls: Array<string> = []
  const toolRouter = makeToolRouter()

  toolRouter.defineTool(
    ToolSign("first", "First tool.", emptyObjectSchema),
    async () => {
      handlerCalls.push("first")
      controller.abort()
      throw new Error("aborted")
    },
  )

  toolRouter.defineTool(
    ToolSign("second", "Second tool.", emptyObjectSchema),
    () => {
      handlerCalls.push("second")
      return "second result"
    },
  )

  let interpretCount = 0
  const model: Model = makeArrayModel(async () => {
    interpretCount += 1
    if (interpretCount === 1) {
      return [
        ToolCallSign({
          callId: "call-first",
          name: "first",
          arguments: "{}",
        }),
        ToolCallSign({
          callId: "call-second",
          name: "second",
          arguments: "{}",
        }),
      ]
    }

    return []
  })

  const context: Array<Sign> = []
  const agent = makeTestAgent(context, model, toolRouter)

  await drainAgentInterpretEvents(
    agentInterpret(agent, [UserSign("run")], {
      signal: controller.signal,
    }),
  )

  assert.equal(interpretCount, 1)
  assert.deepEqual(handlerCalls, ["first"])

  const outputs = context.filter(isToolOutputSign)
  assert.deepEqual(
    outputs.map((output) => output.callId),
    ["call-first", "call-second"],
  )
  assert.match(outputs[0]?.content ?? "", /\[cancelled\]/)
  assert.match(outputs[1]?.content ?? "", /not executed/)
})

test("agentInterpret stops when model emits an error event", async () => {
  const model: Model = {
    providerName: "test",
    name: "test",
    interpret: async function* () {
      yield {
        type: "error",
        error: { type: "network", message: "boom" },
      }
    },
  }
  const context: Array<Sign> = []
  const agent = makeTestAgent(context, model)
  const events: Array<AgentInterpretEvent> = []

  for await (const event of agentInterpret(agent, [UserSign("hello")])) {
    events.push(event)
  }

  assert.deepEqual(events, [
    { type: "sign", sign: UserSign("hello") },
    { type: "step-start" },
    {
      type: "error",
      error: { type: "network", message: "boom" },
    },
  ])
  assert.deepEqual(context, [])
})

test("agentContinue continues from persisted context without appending input", async () => {
  const context: Array<Sign> = [UserSign("hello")]
  let interpretedContext: Array<Sign> = []
  const model: Model = makeArrayModel(async (input) => {
    interpretedContext = [...input]
    return []
  })
  const agent = makeTestAgent(context, model)

  const yielded = await collectAgentInterpretSigns(agentContinue(agent))

  assert.deepEqual(yielded, [])
  assert.deepEqual(
    interpretedContext.map((sign) => sign.kind),
    ["UserSign"],
  )
  assert.deepEqual(
    context.map((sign) => sign.kind),
    ["UserSign"],
  )
})

test("agentInterpret forwards usage events without persisting them", async () => {
  const context: Array<Sign> = []
  const usage = {
    input: 10,
    output: 2,
    cacheRead: 4,
    cacheMiss: 6,
    cacheWrite: 0,
    total: 12,
    raw: { prompt_tokens: 10 },
  }
  const model: Model = {
    providerName: "test",
    name: "test",
    interpret: async function* () {
      yield { type: "usage", usage }
      yield { type: "sign", sign: AssistantSign("answer") }
    },
  }
  const agent = makeTestAgent(context, model)
  const events: Array<AgentInterpretEvent> = []

  for await (const event of agentInterpret(agent, [UserSign("hello")])) {
    events.push(event)
  }

  assert.deepEqual(
    events.map((event) => event.type),
    ["sign", "step-start", "usage", "sign", "step-end", "input-persisted"],
  )
  assert.deepEqual(events[2], { type: "usage", usage })
  assert.deepEqual(
    context.map((sign) => sign.kind),
    ["UserSign", "AssistantSign"],
  )
})

test("agentInterpret forwards delta model events without persisting them", async () => {
  const context: Array<Sign> = []
  const model: Model = {
    providerName: "test",
    name: "test",
    interpret: async function* () {
      yield {
        type: "delta",
        delta: { signKind: "ReasoningSign", content: "r" },
      }
      yield {
        type: "delta",
        delta: { signKind: "AssistantSign", content: "a" },
      }
      yield { type: "sign", sign: AssistantSign("answer") }
    },
  }
  const agent = makeTestAgent(context, model)
  const events: Array<AgentInterpretEvent> = []

  for await (const event of agentInterpret(agent, [UserSign("hello")])) {
    events.push(event)
  }

  assert.deepEqual(
    events.map((event) => event.type),
    [
      "sign",
      "step-start",
      "delta",
      "delta",
      "sign",
      "step-end",
      "input-persisted",
    ],
  )
  assert.deepEqual(
    context.map((sign) => sign.kind),
    ["UserSign", "AssistantSign"],
  )
})
