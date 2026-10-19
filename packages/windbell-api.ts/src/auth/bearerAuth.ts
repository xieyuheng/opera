import type { MiddlewareHandler } from "hono"

import { isAccessTokenExpired, type AccessTokenStore } from "./AccessToken.ts"

export type BearerAuthOptions = {
  store: AccessTokenStore
}

export function makeBearerAuth(options: BearerAuthOptions): MiddlewareHandler {
  return async (c, next) => {
    const value = readBearerToken(c.req.header("Authorization"))

    if (value === undefined) {
      return unauthorized(c)
    }

    const accessToken = await options.store.get(value)
    if (accessToken === undefined || isAccessTokenExpired(accessToken)) {
      return unauthorized(c)
    }

    const touched = await options.store.touch(value)
    if (touched === undefined || isAccessTokenExpired(touched)) {
      return unauthorized(c)
    }

    await next()
  }
}

function readBearerToken(header: string | undefined): string | undefined {
  const match = /^Bearer ([A-Za-z0-9_-]+)$/i.exec(header ?? "")
  return match?.[1]
}

function unauthorized(c: Parameters<MiddlewareHandler>[0]) {
  c.header("WWW-Authenticate", 'Bearer realm="windbell"')
  return c.json(
    {
      error: {
        type: "unauthorized",
        message: "invalid or missing access token",
      },
    },
    401,
  )
}
