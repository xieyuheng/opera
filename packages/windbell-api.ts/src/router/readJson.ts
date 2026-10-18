import type { Context } from "hono"
import { HTTPException } from "hono/http-exception"

export async function readJsonBody(c: Context): Promise<unknown> {
  const text = await c.req.text()
  if (text.trim() === "") return {}

  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new HTTPException(400, { message: "invalid JSON body" })
  }
}

export function readRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new HTTPException(400, { message: "expected a JSON object" })
  }

  return value as Record<string, unknown>
}

export function readString(
  record: Record<string, unknown>,
  name: string,
): string {
  const value = record[name]

  if (typeof value !== "string" || value === "") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a non-empty string`,
    })
  }

  return value
}

export function readBoolean(
  record: Record<string, unknown>,
  name: string,
): boolean | undefined {
  const value = record[name]
  if (value === undefined) return undefined

  if (typeof value !== "boolean") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a boolean`,
    })
  }

  return value
}
