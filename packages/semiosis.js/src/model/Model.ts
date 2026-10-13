import type { Sign, SignDelta } from "../sign/index.ts"
import type { ModelRef } from "./ModelRef.ts"

export type ModelInterpretOptions = {
  signal?: AbortSignal
}

export type ModelErrorType =
  "aborted" | "network" | "http" | "invalid-response" | "unknown"

export type ModelError = {
  type: ModelErrorType
  message: string
  status?: number
}

export type ModelInterpretEvent =
  | { type: "delta"; delta: SignDelta }
  | { type: "sign"; sign: Sign }
  | { type: "error"; error: ModelError }

export type Model = ModelRef & {
  interpret: (
    input: Array<Sign>,
    options?: ModelInterpretOptions,
  ) => AsyncIterable<ModelInterpretEvent>
}
