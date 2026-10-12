import { Hono, type Context } from "hono"
import { HTTPException } from "hono/http-exception"
import type { Shell } from "../../sh/index.ts"
import { makeLocalBash, makeLocalPwsh } from "../../local-sh/index.ts"

export type ShellRouterOptions = {
  sh?: Array<Shell>
}

export function makeShellRouter(options: ShellRouterOptions = {}): Hono {
  const app = new Hono()
  const shList = options.sh ?? [makeLocalBash(), makeLocalPwsh()]
  const shByName = new Map(shList.map((item) => [item.name, item]))

  app.get("/health", (c) => {
    return c.json({ ok: true, service: "sh" })
  })

  app.post("/:name", async (c) => {
    const name = c.req.param("name")
    const sh = shByName.get(name)

    if (sh === undefined) {
      throw new HTTPException(404, {
        message: `unknown shell: ${name}`,
      })
    }

    const body = await readJsonBody(c)
    const command = readString(body, "command")
    const cwd = readString(body, "cwd")
    const timeoutMs = readOptionalNumber(body, "timeoutMs")
    const maxOutputChars = readOptionalNumber(body, "maxOutputChars")
    const result = await sh.run(command, {
      cwd,
      timeoutMs,
      maxOutputChars,
      signal: c.req.raw.signal,
    })

    return c.json(result)
  })

  app.onError((error) => sendError(error))

  return app
}

async function readJsonBody(c: Context): Promise<unknown> {
  const text = await c.req.text()

  if (text.trim() === "") return {}

  try {
    return JSON.parse(text)
  } catch {
    throw new HTTPException(400, { message: "invalid JSON body" })
  }
}

function readRecord(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HTTPException(400, {
      message: "request body must be a JSON object",
    })
  }

  return body as Record<string, unknown>
}

function readString(body: unknown, name: string): string {
  const value = readRecord(body)[name]

  if (typeof value !== "string") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a string`,
    })
  }

  return value
}

function readOptionalNumber(body: unknown, name: string): number | undefined {
  const value = readRecord(body)[name]

  if (value === undefined) return undefined

  if (typeof value !== "number") {
    throw new HTTPException(400, {
      message: `field \`${name}\` must be a number`,
    })
  }

  return value
}

function sendJson(statusCode: number, value: unknown): Response {
  return new Response(JSON.stringify(value ?? null), {
    status: statusCode,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  })
}

function sendError(error: unknown): Response {
  const statusCode = error instanceof HTTPException ? error.status : 500
  const message = error instanceof Error ? error.message : String(error)

  return sendJson(statusCode, {
    error: {
      message,
    },
  })
}
