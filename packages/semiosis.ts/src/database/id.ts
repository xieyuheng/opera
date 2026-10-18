import { err, ok, type Result } from "@windbell/std.ts/result"
import { makeDatabaseError, type DatabaseError } from "./DatabaseError.ts"

export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id)
}

export function validateId(id: string): Result<void, DatabaseError> {
  if (isValidId(id)) return ok(undefined)

  return err(
    makeDatabaseError({
      type: "invalid-id",
      message: `[database] invalid id: ${id}`,
      info: { id },
    }),
  )
}

export function assertId(id: string): void {
  if (!isValidId(id)) {
    throw new Error(`[database] invalid id: ${id}`)
  }
}

export function makeId(prefix: string): string {
  const id = `${prefix}-${globalThis.crypto.randomUUID()}`
  assertId(id)
  return id
}
