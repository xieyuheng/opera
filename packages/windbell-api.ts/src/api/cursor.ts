import { Buffer } from "node:buffer"

export type WorkspaceSessionCursor = {
  updatedAt: number
  id: string
}

export function encodeWorkspaceSessionCursor(
  cursor: WorkspaceSessionCursor,
): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url")
}

export function decodeWorkspaceSessionCursor(
  value: string,
): WorkspaceSessionCursor | undefined {
  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    )

    if (parsed === null || typeof parsed !== "object") return undefined

    const record = parsed as Record<string, unknown>

    if (
      typeof record.updatedAt !== "number" ||
      !Number.isFinite(record.updatedAt) ||
      typeof record.id !== "string" ||
      record.id === ""
    ) {
      return undefined
    }

    return {
      updatedAt: record.updatedAt,
      id: record.id,
    }
  } catch {
    return undefined
  }
}
