import type * as S from "@xieyuheng/semiosis.ts/core"

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
