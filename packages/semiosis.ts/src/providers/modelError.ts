import { HttpRequestError } from "@windbell/http.ts"
import { ZodError } from "zod"

import type { ModelError, ModelInterpretEvent } from "../model/index.ts"

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isAbortError(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false

  return (error as { name?: unknown }).name === "AbortError"
}

export function makeModelErrorFromUnknown(error: unknown): ModelError {
  if (isAbortError(error)) {
    return { type: "aborted", message: errorMessage(error) }
  }

  if (error instanceof HttpRequestError) {
    if (error.status === undefined) {
      return { type: "invalid-response", message: error.message }
    }

    return {
      type: "http",
      message: error.message,
      status: error.status,
    }
  }

  if (error instanceof ZodError || error instanceof SyntaxError) {
    return { type: "invalid-response", message: errorMessage(error) }
  }

  if (error instanceof TypeError) {
    return { type: "network", message: errorMessage(error) }
  }

  return { type: "unknown", message: errorMessage(error) }
}

export async function* withModelErrorEvent(
  events: AsyncIterable<ModelInterpretEvent>,
): AsyncGenerator<ModelInterpretEvent> {
  try {
    yield* events
  } catch (error) {
    yield { type: "error", error: makeModelErrorFromUnknown(error) }
  }
}
