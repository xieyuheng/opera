import type {
  DatabaseError,
  DatabaseErrorType,
} from "../database/DatabaseError.ts"

export type ServiceErrorType =
  | DatabaseErrorType
  | "session-id-mismatch"
  | "session-locked"
  | "provider-config-invalid"
  | "theme-not-found"
  | "provider-not-found"
  | "model-not-found"
  | "api-key-not-configured"
  | "dustbin-workspace-not-found"
  | "dustbin-session-not-found"
  | "model-error"
  | "unknown"

export type ServiceError = {
  type: ServiceErrorType
  message: string
  info?: Record<string, unknown>
}

export function makeServiceError(error: ServiceError): ServiceError {
  return error
}

export function makeServiceErrorFromDatabaseError(
  error: DatabaseError,
): ServiceError {
  return {
    type: error.type,
    message: error.message,
    info: error.info,
  }
}

export function isServiceError(value: unknown): value is ServiceError {
  if (value === null || typeof value !== "object") return false

  const type = (value as { type?: unknown }).type
  const message = (value as { message?: unknown }).message
  return typeof type === "string" && typeof message === "string"
}
