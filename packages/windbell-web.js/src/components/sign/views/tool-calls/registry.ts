import type { Component } from "vue"
import type * as S from "@windbell/semiosis.js"
import BashToolCallView from "./BashToolCallView.vue"
import PwshToolCallView from "./PwshToolCallView.vue"
import DefaultToolCallView from "./DefaultToolCallView.vue"

const toolCallViews: Partial<Record<string, Component>> = {
  bash: BashToolCallView,
  pwsh: PwshToolCallView,
}

export function resolveToolCallView(sign: S.ToolCallSign): Component {
  return toolCallViews[sign.name] ?? DefaultToolCallView
}
