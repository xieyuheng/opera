import type * as S from "@windbell/semiosis.js"

export function serviceErrorStatus(error: S.ServiceError): number {
  if (error.type === "not-found" || error.type.endsWith("-not-found")) {
    return 404
  }

  if (error.type === "already-exists" || error.type.includes("-already-")) {
    return 409
  }

  if (error.type === "workspace-already-exists") return 409
  if (error.type === "session-id-mismatch") return 409

  switch (error.type) {
    case "aborted":
      return 408
    case "permission-denied":
    case "read-only":
      return 403
    case "busy":
    case "directory-not-empty":
    case "session-locked":
      return 409
    case "invalid-id":
    case "invalid-json":
    case "invalid-path":
    case "not-a-directory":
    case "not-a-file":
    case "is-a-directory":
    case "api-key-empty":
    case "provider-name-mismatch":
      return 400
    case "no-space":
      return 507
    default:
      return 500
  }
}
