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
