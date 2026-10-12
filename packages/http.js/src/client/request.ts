import { HttpRequestError, isHttpStatus } from "./HttpRequestError.ts"

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export type HttpRequestOptions = {
  baseUrl: string
  method: string
  path: string
  query?: URLSearchParams
  body?: BodyInit | null
  headers?: HeadersInit
  signal?: AbortSignal
}

export type JsonRequestOptions = Omit<HttpRequestOptions, "body"> & {
  body?: unknown
}

export type RequestErrorOptions = Pick<
  HttpRequestOptions,
  "baseUrl" | "method" | "path" | "query"
>

export function withQuery(path: string, query?: URLSearchParams): string {
  const text = query?.toString() ?? ""
  if (text === "") return path

  return path.includes("?") ? `${path}&${text}` : `${path}?${text}`
}

export function makeUrl(
  baseUrl: string,
  path: string,
  query?: URLSearchParams,
): string {
  const base = baseUrl.replace(/\/+$/, "")
  const suffix = path.startsWith("/") ? path : `/${path}`

  return withQuery(`${base}${suffix}`, query)
}

export function mergeHeaders(
  ...sources: Array<HeadersInit | undefined>
): Headers {
  const headers = new Headers()

  for (const source of sources) {
    if (source === undefined) continue

    new Headers(source).forEach((value, key) => {
      headers.set(key, value)
    })
  }

  return headers
}

export function makeRequest(options: HttpRequestOptions): {
  url: string
  init: RequestInit
} {
  const url = makeUrl(options.baseUrl, options.path, options.query)
  const headers = mergeHeaders(options.headers)

  return {
    url,
    init: {
      method: options.method,
      headers,
      body: options.body,
      signal: options.signal,
    },
  }
}

export function makeJsonRequestOptions(
  options: JsonRequestOptions,
): HttpRequestOptions {
  const headers = mergeHeaders(options.headers)
  const body =
    options.body === undefined ? undefined : JSON.stringify(options.body)

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  return {
    ...options,
    headers,
    body,
  }
}

export async function sendRequest(
  options: HttpRequestOptions,
): Promise<Response> {
  const { url, init } = makeRequest(options)

  return await fetch(url, init)
}

export function requestOperation(
  options: Pick<HttpRequestOptions, "method" | "path">,
): string {
  return `${options.method} ${options.path}`
}

function parseJsonOrUndefined(text: string): unknown {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return undefined
  }
}

function readErrorMessage(value: unknown, fallback: string): string {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const error = (value as { error?: unknown }).error
    if (error !== null && typeof error === "object") {
      const message = (error as { message?: unknown }).message
      if (typeof message === "string") return message
    }
  }

  return fallback
}

export async function throwResponseError(
  response: Response,
  options: RequestErrorOptions,
): Promise<never> {
  const text = await response.text()
  const value = text === "" ? null : parseJsonOrUndefined(text)

  throw new HttpRequestError({
    operation: requestOperation(options),
    method: options.method,
    path: options.path,
    url: makeUrl(options.baseUrl, options.path, options.query),
    status: response.status,
    detail: readErrorMessage(value, text === "" ? response.statusText : text),
  })
}

export async function requestJson<T = unknown>(
  options: JsonRequestOptions,
): Promise<T> {
  const requestOptions = makeJsonRequestOptions(options)
  const headers = mergeHeaders(
    new Headers({ Accept: "application/json" }),
    requestOptions.headers,
  )

  const response = await sendRequest({
    ...requestOptions,
    headers,
  })

  if (!response.ok) {
    await throwResponseError(response, options)
  }

  const text = await response.text()

  let value: unknown

  try {
    value = text === "" ? null : JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    throw new HttpRequestError({
      operation: requestOperation(options),
      method: options.method,
      path: options.path,
      url: makeUrl(options.baseUrl, options.path, options.query),
      detail: `invalid JSON: ${message}`,
    })
  }

  return value as T
}

export async function requestJsonOptional<T = unknown>(
  options: JsonRequestOptions,
): Promise<T | undefined> {
  try {
    return await requestJson<T>(options)
  } catch (error) {
    if (isHttpStatus(error, 404)) return undefined

    throw error
  }
}

export async function requestBytes(
  options: JsonRequestOptions,
): Promise<Uint8Array> {
  const requestOptions = makeJsonRequestOptions(options)
  const response = await sendRequest(requestOptions)

  if (!response.ok) {
    await throwResponseError(response, requestOptions)
  }

  return new Uint8Array(await response.arrayBuffer())
}
