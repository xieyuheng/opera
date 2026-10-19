import { errorReport } from "@windbell/std.ts/error"
import { Ajv } from "ajv"

import {
  ToolOutputSign,
  type ToolCallSign,
  type ToolSign,
} from "../sign/index.ts"
import type { ToolHandler, ToolRoute } from "./Tool.ts"

export type ToolRunOptions = {
  signal?: AbortSignal
}

export class ToolRouter {
  ajv = new Ajv({
    allErrors: true,
    strict: false,
  })

  routes: Record<string, ToolRoute> = {}

  defineTool(sign: ToolSign, handler: ToolHandler): void {
    if (this.routes[sign.name] !== undefined) {
      throw new Error(`[ToolRouter] duplicate tool: ${sign.name}`)
    }

    const validate = this.ajv.compile(sign.parameters)
    this.routes[sign.name] = { sign, handler, validate }
  }

  async run(
    toolCall: ToolCallSign,
    options: ToolRunOptions = {},
  ): Promise<ToolOutputSign> {
    const signal = options.signal

    if (signal?.aborted) {
      return ToolOutputSign(
        toolCall.callId,
        "[cancelled] tool call was not executed.",
      )
    }

    try {
      const route = this.routes[toolCall.name]
      if (route === undefined) {
        return ToolOutputSign(
          toolCall.callId,
          `[ToolRouter] unknown tool: ${toolCall.name}`,
        )
      }

      const args = toolArgumentsParse(toolCall)

      if (!route.validate(args)) {
        const errors = route.validate.errors ?? []
        const message = errors
          .map((error) => `${error.instancePath} ${error.message}`.trim())
          .join("; ")

        return ToolOutputSign(
          toolCall.callId,
          `[ToolRouter] invalid arguments for tool ${toolCall.name}: ${message}`,
        )
      }

      const content = await route.handler(args, { signal })
      return ToolOutputSign(toolCall.callId, content)
    } catch (error) {
      if (signal?.aborted) {
        return ToolOutputSign(
          toolCall.callId,
          "[cancelled] tool execution aborted; it may have partially executed.",
        )
      }

      return ToolOutputSign(toolCall.callId, errorReport(error))
    }
  }

  get toolSigns(): Array<ToolSign> {
    return Object.values(this.routes).map((route) => route.sign)
  }
}

export function makeToolRouter(): ToolRouter {
  return new ToolRouter()
}

function toolArgumentsParse(toolCall: ToolCallSign): Record<string, unknown> {
  const value = toolArgumentsJsonParse(toolCall)

  if (typeof value !== "object" || value === null || value instanceof Array) {
    throw new Error(
      `[ToolRouter] arguments for tool ${toolCall.name} must be a JSON object`,
    )
  }

  return value as Record<string, unknown>
}

function toolArgumentsJsonParse(toolCall: ToolCallSign): unknown {
  try {
    return JSON.parse(toolCall.arguments)
  } catch (error) {
    throw new Error(
      `[ToolRouter] invalid arguments for tool ${toolCall.name}: ${errorReport(error)}`,
    )
  }
}
