import type * as S from "@windbell/semiosis.js/node"

export function parseToolCallArguments(sign: S.ToolCallSign): unknown {
  try {
    return JSON.parse(sign.arguments)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[SignToolCallView] invalid JSON arguments for tool ${sign.name}: ${message}`,
    )
  }
}
