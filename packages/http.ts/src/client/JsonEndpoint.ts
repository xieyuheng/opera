import type { z } from "zod"

import { HttpRequestError, isHttpStatus } from "./HttpRequestError.ts"
import {
  mergeHeaders,
  type HttpMethod,
  makeUrl,
  requestJson,
} from "./request.ts"

export type HeaderSource = HeadersInit | (() => HeadersInit)

export type HttpClientConfig = {
  baseUrl: string
  headers?: HeaderSource
}

export type JsonEndpointOptions<Input, Output> = {
  method: HttpMethod
  path: string | ((input: Input) => string)
  query?: (input: Input) => URLSearchParams
  body?: (input: Input) => unknown
  output: z.ZodType<Output>
  headers?: HeadersInit | ((input: Input) => HeadersInit)
}

export function resolveHeaders(
  source: HeaderSource | undefined,
): HeadersInit | undefined {
  return typeof source === "function" ? source() : source
}

export type JsonEndpoint<Input, Output> = (input?: Input) => Promise<Output>

export function makeJsonEndpoint<Input = void, Output = unknown>(
  config: HttpClientConfig,
  options: JsonEndpointOptions<Input, Output>,
): JsonEndpoint<Input, Output> {
  return async (input?: Input) => {
    const path =
      typeof options.path === "function"
        ? options.path(input as Input)
        : options.path

    const query = options.query?.(input as Input)
    const body = options.body?.(input as Input)
    const endpointHeaders =
      typeof options.headers === "function"
        ? options.headers(input as Input)
        : options.headers

    const endpoint = `${options.method} ${path}`
    const url = makeUrl(config.baseUrl, path, query)

    try {
      const value = await requestJson<unknown>({
        baseUrl: config.baseUrl,
        method: options.method,
        path,
        query,
        body,
        headers: mergeHeaders(resolveHeaders(config.headers), endpointHeaders),
      })

      const result = options.output.safeParse(value)
      if (!result.success) {
        throw new JsonEndpointError({
          endpoint,
          url,
          detail: `invalid response: ${result.error.message}`,
        })
      }

      return result.data
    } catch (error) {
      if (error instanceof JsonEndpointError) throw error

      if (error instanceof HttpRequestError) {
        throw new JsonEndpointError({
          endpoint,
          url,
          status: error.status,
          detail: error.detail,
        })
      }

      throw error
    }
  }
}

export function withNotFoundAsUndefined<Input, Output>(
  endpoint: JsonEndpoint<Input, Output>,
): (input: Input) => Promise<Output | undefined> {
  return async (input: Input) => {
    try {
      return await endpoint(input)
    } catch (error) {
      if (isHttpStatus(error, 404)) return undefined

      throw error
    }
  }
}

export type JsonEndpointErrorOptions = {
  endpoint: string
  url: string
  status?: number
  detail: string
}

export class JsonEndpointError extends HttpRequestError {
  endpoint: string

  constructor(options: JsonEndpointErrorOptions) {
    super({
      operation: options.endpoint,
      url: options.url,
      status: options.status,
      detail: options.detail,
    })

    this.name = "JsonEndpointError"
    this.endpoint = options.endpoint
  }
}
