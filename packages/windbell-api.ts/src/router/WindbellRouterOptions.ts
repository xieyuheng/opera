import type * as S from "@xieyuheng/semiosis.ts"

export type WindbellRouterOptions = {
  database: S.Database
  corsOrigin: string | undefined
  lockRoot: string
}
