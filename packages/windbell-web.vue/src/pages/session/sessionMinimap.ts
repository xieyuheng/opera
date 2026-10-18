import type * as S from "@windbell/semiosis.ts/core"

export type SessionMinimapBlock = {
  index: number
  kind: S.Sign["kind"]
  top: number
  height: number
  turnIndex?: number
}

export type SessionSignListMetrics = {
  blocks: SessionMinimapBlock[]
  scrollTop: number
  clientHeight: number
  scrollHeight: number
}
