import {
  isAssistantSign,
  isProviderDataSign,
  isReasoningSign,
  isToolCallSign,
  type Sign,
  type SignDelta,
  type ToolCallSign,
} from "../sign/index.ts"
import type { ModelError, ModelUsage } from "../model/index.ts"
import type { Agent } from "./Agent.ts"
import { repairOrphanToolCalls } from "./repairOrphanToolCalls.ts"

export type AgentInterpretOptions = {
  signal?: AbortSignal
}

export type AgentInterpretEvent =
  | { type: "delta"; delta: SignDelta }
  | { type: "sign"; sign: Sign }
  | { type: "input-persisted" }
  | { type: "error"; error: ModelError }
  | { type: "usage"; usage: ModelUsage }

type CollectModelOutputResult = { kind: "completed" } | { kind: "error" }

export async function* agentInterpret(
  agent: Agent,
  input: Array<Sign>,
  options: AgentInterpretOptions = {},
): AsyncGenerator<AgentInterpretEvent> {
  yield* repairAgent(agent)

  const context = [...(await agent.getContext()), ...input]
  const output: Array<Sign> = []

  const result = yield* collectModelOutput(agent, context, output, options)
  if (result.kind === "error") return

  await agent.appendContext(input)
  yield { type: "input-persisted" }

  for (const sign of input) {
    yield { type: "sign", sign }
  }

  yield* agentLoop(agent, output, options)
}

export async function* agentContinue(
  agent: Agent,
  options: AgentInterpretOptions = {},
): AsyncGenerator<AgentInterpretEvent> {
  yield* repairAgent(agent)

  const output: Array<Sign> = []

  const result = yield* collectModelOutput(
    agent,
    await agent.getContext(),
    output,
    options,
  )
  if (result.kind === "error") return

  yield* agentLoop(agent, output, options)
}

async function* repairAgent(agent: Agent): AsyncGenerator<AgentInterpretEvent> {
  const repairs = await repairOrphanToolCalls(agent)

  for (const sign of repairs) {
    yield { type: "sign", sign }
  }
}

async function* collectModelOutput(
  agent: Agent,
  context: Array<Sign>,
  output: Array<Sign>,
  options: AgentInterpretOptions,
): AsyncGenerator<AgentInterpretEvent, CollectModelOutputResult> {
  for await (const event of agent.model.interpret(context, {
    signal: options.signal,
  })) {
    if (event.type === "error") {
      yield { type: "error", error: event.error }
      return { kind: "error" }
    }

    if (event.type === "usage") {
      yield { type: "usage", usage: event.usage }
      continue
    }

    if (event.type === "delta") {
      yield { type: "delta", delta: event.delta }
      continue
    }

    output.push(event.sign)
  }

  return { kind: "completed" }
}

function assertModelOutputSign(sign: Sign): void {
  if (
    !isReasoningSign(sign) &&
    !isAssistantSign(sign) &&
    !isProviderDataSign(sign) &&
    !isToolCallSign(sign)
  ) {
    throw new Error(
      `[agentInterpret] unexpected model output sign: ${sign.kind}`,
    )
  }
}

async function* agentLoop(
  agent: Agent,
  initialOutput: Array<Sign>,
  options: AgentInterpretOptions,
): AsyncGenerator<AgentInterpretEvent> {
  let output = initialOutput

  while (true) {
    if (options.signal?.aborted) return

    output.forEach(assertModelOutputSign)
    await agent.appendContext(output)
    yield* output.map((sign): AgentInterpretEvent => ({ type: "sign", sign }))

    const toolCallSigns = output.filter(isToolCallSign)
    if (toolCallSigns.length === 0) return

    for (const toolCallSign of toolCallSigns) {
      const sign = await agent.toolRouter.run(toolCallSign, {
        signal: options.signal,
      })

      await agent.appendContext([sign])
      yield { type: "sign", sign }
    }

    if (options.signal?.aborted) return

    const nextOutput: Array<Sign> = []
    const result = yield* collectModelOutput(
      agent,
      await agent.getContext(),
      nextOutput,
      options,
    )
    if (result.kind === "error") return

    output = nextOutput
  }
}
