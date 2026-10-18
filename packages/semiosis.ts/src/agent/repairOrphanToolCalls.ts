import {
  ToolOutputSign,
  isToolCallSign,
  isToolOutputSign,
  type Sign,
  type ToolCallSign,
  type ToolOutputSign as ToolOutputSignType,
} from "../sign/index.ts"
import type { Agent } from "./Agent.ts"

export function findOrphanToolCalls(signs: Array<Sign>): Array<ToolCallSign> {
  const outputCallIds = new Set(
    signs.filter(isToolOutputSign).map((sign) => sign.callId),
  )

  return signs
    .filter(isToolCallSign)
    .filter((toolCall) => !outputCallIds.has(toolCall.callId))
}

export async function repairOrphanToolCalls(
  agent: Agent,
): Promise<Array<ToolOutputSignType>> {
  const context = await agent.getContext()
  const orphanToolCalls = findOrphanToolCalls(context)

  if (orphanToolCalls.length === 0) return []

  const repairs = orphanToolCalls.map(makeOrphanToolOutput)
  await agent.appendContext(repairs)
  return repairs
}

export function makeOrphanToolOutput(
  toolCall: ToolCallSign,
): ToolOutputSignType {
  return ToolOutputSign(
    toolCall.callId,
    [
      "[ToolRouter] tool call was interrupted before a result was recorded.",
      `tool: ${toolCall.name}`,
      `arguments: ${toolCall.arguments}`,
      "The tool may have partially executed.",
      "Inspect the workspace before retrying.",
    ].join("\n"),
  )
}
