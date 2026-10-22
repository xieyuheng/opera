import type * as W from "@xieyuheng/windbell.ts/core"

export type SessionMinimapBlock = {
  index: number
  kind: W.Sign["kind"]
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
