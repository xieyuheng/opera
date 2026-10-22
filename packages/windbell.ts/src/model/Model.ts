import type { Sign, SignDelta } from "../sign/index.ts"
import type { ModelRef } from "./ModelRef.ts"

export type ModelInterpretOptions = {
  signal?: AbortSignal
}

export type ModelErrorType =
  | "aborted"
  | "network"
  | "http"
  | "invalid-response"
  | "unknown"

export type ModelError = {
  type: ModelErrorType
  message: string
  status?: number
}

export type ModelUsage = {
  input: number
  output: number
  cacheRead: number
  cacheMiss: number
  cacheWrite: number
  total: number
  raw: unknown
}

export type ModelTotalUsage = {
  input: number
  output: number
  cacheRead: number
  cacheMiss: number
  cacheWrite: number
  total: number
}

export type ModelInterpretEvent =
  | { type: "delta"; delta: SignDelta }
  | { type: "sign"; sign: Sign }
  | { type: "error"; error: ModelError }
  | { type: "usage"; usage: ModelUsage }

export type Model = ModelRef & {
  interpret: (
    input: Array<Sign>,
    options?: ModelInterpretOptions,
  ) => AsyncIterable<ModelInterpretEvent>
}
