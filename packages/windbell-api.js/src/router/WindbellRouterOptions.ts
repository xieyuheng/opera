import type * as S from "@windbell/semiosis.js/node"

export type WindbellRouterOptions = {
  database: S.Database
  corsOrigin: string | undefined
  lockRoot?: string
}
