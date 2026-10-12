export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id)
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
