import type { JsonObject } from "@windbell/std.ts/json"

export type FileSystemErrorType =
  | "aborted"
  | "not-found"
  | "permission-denied"
  | "read-only"
  | "already-exists"
  | "directory-not-empty"
  | "busy"
  | "not-a-directory"
  | "not-a-file"
  | "is-a-directory"
  | "invalid-path"
  | "no-space"
  | "too-many-open-files"
  | "cross-device"
  | "too-many-symbolic-links"
  | "http-error"
  | "invalid-response"
  | "unknown"

export type FileSystemError = {
  type: FileSystemErrorType
  who: string
  message: string
  info?: JsonObject
}
