import type * as W from "@xieyuheng/windbell.ts/core"

export function parseToolCallArguments(sign: W.ToolCallSign): unknown {
  try {
    return JSON.parse(sign.arguments)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[SignToolCallView] invalid JSON arguments for tool ${sign.name}: ${message}`,
    )
  }
}
