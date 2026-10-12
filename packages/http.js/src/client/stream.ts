import { HttpRequestError } from "./HttpRequestError.ts"
import {
  type JsonRequestOptions,
  type RequestErrorOptions,
  makeJsonRequestOptions,
  makeUrl,
  mergeHeaders,
  requestOperation,
  sendRequest,
  throwResponseError,
} from "./request.ts"

export type ServerSentEvent = {
  event: string
  data: string
  id?: string
  retry?: number
}

export async function* readNdjson<T>(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<T> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += decoder.decode(value, { stream: !done })

      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === "") continue

        yield JSON.parse(trimmed) as T
      }

      if (done) break
    }

    if (buffer.trim() !== "") {
      yield JSON.parse(buffer) as T
    }
  } finally {
    reader.releaseLock()
  }
}

export async function* requestNdjson<T>(
  options: JsonRequestOptions,
): AsyncGenerator<T> {
  const requestOptions = makeJsonRequestOptions(options)
  const headers = mergeHeaders(
    new Headers({ Accept: "application/x-ndjson" }),
    requestOptions.headers,
  )

  const response = await sendRequest({
    ...requestOptions,
    headers,
  })

  if (!response.ok) {
    await throwResponseError(response, requestOptions)
  }

  if (response.body === null) {
    throw makeNullBodyError(requestOptions)
  }

  yield* readNdjson<T>(response.body)
}

export async function* readServerSentEvents(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<ServerSentEvent> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (value !== undefined) {
        buffer += decoder.decode(value, { stream: true })
      }

      if (done) {
        buffer += decoder.decode()
      }

      const result = takeServerSentEvents(buffer)
      buffer = result.rest

      for (const event of result.events) {
        yield event
      }

      if (done) break
    }
  } finally {
    reader.releaseLock()
  }
}

export async function* requestServerSentEvents(
  options: JsonRequestOptions,
): AsyncGenerator<ServerSentEvent> {
  const requestOptions = makeJsonRequestOptions(options)
  const headers = mergeHeaders(
    new Headers({ Accept: "text/event-stream" }),
    requestOptions.headers,
  )

  const response = await sendRequest({
    ...requestOptions,
    headers,
  })

  if (!response.ok) {
    await throwResponseError(response, requestOptions)
  }

  if (response.body === null) {
    throw makeNullBodyError(requestOptions)
  }

  yield* readServerSentEvents(response.body)
}

type ServerSentEventSeparator = {
  index: number
  length: number
}

function takeServerSentEvents(buffer: string): {
  events: Array<ServerSentEvent>
  rest: string
} {
  const events: Array<ServerSentEvent> = []

  while (true) {
    const separator = findServerSentEventSeparator(buffer)
    if (separator === undefined) break

    const block = normalizeNewlines(buffer.slice(0, separator.index))
    buffer = buffer.slice(separator.index + separator.length)

    const event = parseServerSentEventBlock(block)
    if (event !== undefined) events.push(event)
  }

  return { events, rest: buffer }
}

function findServerSentEventSeparator(
  buffer: string,
): ServerSentEventSeparator | undefined {
  const candidates: Array<ServerSentEventSeparator> = [
    { index: buffer.indexOf("\r\n\r\n"), length: 4 },
    { index: buffer.indexOf("\n\n"), length: 2 },
    { index: buffer.indexOf("\r\r"), length: 2 },
  ].filter((candidate) => candidate.index !== -1)

  if (candidates.length === 0) return undefined

  return candidates.reduce((best, current) => {
    if (current.index < best.index) return current
    if (current.index === best.index && current.length > best.length) {
      return current
    }

    return best
  })
}

function parseServerSentEventBlock(block: string): ServerSentEvent | undefined {
  let event = "message"
  const dataLines: Array<string> = []
  let id: string | undefined
  let retry: number | undefined

  for (const line of block.split("\n")) {
    if (line === "" || line.startsWith(":")) continue

    const colonIndex = line.indexOf(":")
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex)
    let value = colonIndex === -1 ? "" : line.slice(colonIndex + 1)

    if (value.startsWith(" ")) value = value.slice(1)

    if (field === "event") {
      event = value
    } else if (field === "data") {
      dataLines.push(value)
    } else if (field === "id") {
      id = value
    } else if (field === "retry" && /^\d+$/.test(value)) {
      retry = Number(value)
    }
  }

  if (dataLines.length === 0) return undefined

  const result: ServerSentEvent = {
    event,
    data: dataLines.join("\n"),
  }

  if (id !== undefined) result.id = id
  if (retry !== undefined) result.retry = retry

  return result
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function makeNullBodyError(options: RequestErrorOptions): HttpRequestError {
  return new HttpRequestError({
    operation: requestOperation(options),
    method: options.method,
    path: options.path,
    url: makeUrl(options.baseUrl, options.path, options.query),
    detail: "response body is null",
  })
}
