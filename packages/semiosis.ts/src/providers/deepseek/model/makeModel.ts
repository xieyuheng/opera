import type { Model } from "../../../model/index.ts"
import { withModelErrorEvent } from "../../modelError.ts"
import type { Client } from "../client/index.ts"
import { interpret } from "./interpret.ts"
import type { ModelConfig } from "./ModelConfig.ts"

export function makeModel(client: Client, config: ModelConfig): Model {
  return {
    providerName: "deepseek",
    name: config.name,
    interpret: (input, options) =>
      withModelErrorEvent(interpret(client, config, input, options)),
  }
}
