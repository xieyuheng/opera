import type * as S from "@windbell/semiosis.js/node"

export type SemiosisServerOptions = {
  database: S.Database
  hostname: string
  port: number
  basePath: string
}
