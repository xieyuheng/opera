import type { ModelUsage } from "../model/index.ts"
import type { Sign, SignDelta } from "../sign/index.ts"

export type TurnEvent =
  | { type: "delta"; delta: SignDelta }
  | { type: "sign"; sign: Sign }
  | { type: "usage"; usage: ModelUsage }
  | {
      type: "error"
      message: string
      retryable: boolean
      inputPersisted: boolean
    }
