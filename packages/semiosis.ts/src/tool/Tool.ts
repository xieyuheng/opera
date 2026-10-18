import type { ValidateFunction } from "ajv"
import type { ToolSign } from "../sign/index.ts"

export type ToolHandlerOptions = {
  signal?: AbortSignal
}

export type ToolHandler = (
  args: Record<string, unknown>,
  options: ToolHandlerOptions,
) => string | Promise<string>

export type ToolRoute = {
  sign: ToolSign
  handler: ToolHandler
  validate: ValidateFunction
}
