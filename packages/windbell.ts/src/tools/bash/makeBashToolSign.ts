import { ToolSign } from "../../sign/index.ts"

export type BashToolSignOptions = {
  description: string
}

export const bashToolParameters = {
  type: "object",
  properties: {
    command: {
      type: "string",
      description: "The bash command to execute.",
    },
  },
  required: ["command"],
  additionalProperties: false,
}

export function makeBashToolSign(options: BashToolSignOptions): ToolSign {
  return ToolSign("bash", options.description, bashToolParameters)
}
