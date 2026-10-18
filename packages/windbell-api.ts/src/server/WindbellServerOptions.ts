import type { WindbellRouterOptions } from "../router/index.ts"

export type WindbellServerOptions = WindbellRouterOptions & {
  hostname: string
  port: number
  webDistRoot: string | undefined
}
