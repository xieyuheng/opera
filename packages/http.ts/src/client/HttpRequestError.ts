export type HttpRequestErrorOptions = {
  operation?: string
  method?: string
  path?: string
  url?: string
  status?: number
  detail: string
}

export class HttpRequestError extends Error {
  operation: string | undefined
  method: string | undefined
  path: string | undefined
  url: string
  status: number | undefined
  detail: string

  constructor(options: HttpRequestErrorOptions) {
    const operation =
      options.operation ??
      [options.method, options.path]
        .filter((part): part is string => part !== undefined)
        .join(" ")

    const status = options.status === undefined ? "" : `HTTP ${options.status}`
    const label = [operation, status].filter((part) => part !== "").join(" ")

    super(label === "" ? options.detail : `${label}: ${options.detail}`)
    this.name = "HttpRequestError"
    this.operation = options.operation
    this.method = options.method
    this.path = options.path
    this.url = options.url ?? ""
    this.status = options.status
    this.detail = options.detail
  }
}

export function isHttpStatus(error: unknown, status: number): boolean {
  return error instanceof HttpRequestError && error.status === status
}
