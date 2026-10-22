import type { Model, ModelRef } from "../model/index.ts"
import type { Sign } from "../sign/index.ts"

export type MockModel = Model & {
  turns: Array<Array<Sign>>
  step: number
}

export function makeMockModel(
  ref: ModelRef,
  outputs: Array<Array<Sign>>,
): MockModel {
  if (outputs.length === 0) {
    throw new Error("[makeMockModel] outputs must not be empty")
  }

  const model: MockModel = {
    ...ref,
    turns: [],
    step: 0,
    interpret: async function* (input) {
      model.turns.push(input)

      const output = outputs[model.step]
      if (output === undefined) {
        throw new Error("[makeMockModel] no more outputs")
      }

      model.step += 1

      for (const sign of output) {
        yield { type: "sign", sign }
      }
    },
  }

  return model
}
