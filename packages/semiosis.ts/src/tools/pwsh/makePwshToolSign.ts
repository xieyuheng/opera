import { ToolSign } from "../../sign/index.ts"

export type PwshToolSignOptions = {
  description: string
}

export const pwshToolParameters = {
  type: "object",
  properties: {
    command: {
      type: "string",
      description: "The PowerShell command to execute.",
    },
  },
  required: ["command"],
  additionalProperties: false,
}

export function makePwshToolSign(options: PwshToolSignOptions): ToolSign {
  return ToolSign("pwsh", options.description, pwshToolParameters)
}
