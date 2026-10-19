import type * as S from "@windbell/semiosis.ts/core"
import type { Component } from "vue"

import BashToolCallView from "./BashToolCallView.vue"
import DefaultToolCallView from "./DefaultToolCallView.vue"
import PwshToolCallView from "./PwshToolCallView.vue"

const toolCallViews: Partial<Record<string, Component>> = {
  bash: BashToolCallView,
  pwsh: PwshToolCallView,
}

export function resolveToolCallView(sign: S.ToolCallSign): Component {
  return toolCallViews[sign.name] ?? DefaultToolCallView
}
