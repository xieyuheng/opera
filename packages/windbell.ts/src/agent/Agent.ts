import type { Model } from "../model/Model.ts"
import type { Sign } from "../sign/index.ts"
import type { ToolRouter } from "../tool/index.ts"

export type AgentOptions = {
  model: Model
  toolRouter: ToolRouter
  getContext: () => Promise<Array<Sign>>
  appendContext: (signs: Array<Sign>) => Promise<void>
}

export type Agent = AgentOptions

export function makeAgent(options: AgentOptions): Agent {
  return options
}
