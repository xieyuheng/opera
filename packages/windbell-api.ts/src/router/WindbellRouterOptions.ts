import type * as W from "@xieyuheng/windbell.ts"

export type WindbellRouterOptions = {
  database: W.Database
  corsOrigin: string | undefined
  lockRoot: string
}
