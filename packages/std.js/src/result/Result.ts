export type Result<V, E> = OkResult<V> | ErrorResult<E>

export type OkResult<V> = {
  kind: "OkResult"
  value: V
}

export type ErrorResult<E> = {
  kind: "ErrorResult"
  error: E
}

export function ok<V>(value: V): OkResult<V> {
  return { kind: "OkResult", value }
}

export function err<E>(error: E): ErrorResult<E> {
  return { kind: "ErrorResult", error }
}

export function isOk<V, E>(result: Result<V, E>): result is OkResult<V> {
  return result.kind === "OkResult"
}

export function isError<V, E>(result: Result<V, E>): result is ErrorResult<E> {
  return result.kind === "ErrorResult"
}

export class ResultUnwrapError<E> extends Error {
  error: E

  constructor(error: E) {
    super(resultErrorMessage(error))
    this.name = "ResultUnwrapError"
    this.error = error
  }
}

export function unwrap<V, E>(result: Result<V, E>): V {
  if (result.kind === "ErrorResult") {
    throw new ResultUnwrapError(result.error)
  }

  return result.value
}

function resultErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  if (
    error !== null &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message
  }

  return String(error)
}
