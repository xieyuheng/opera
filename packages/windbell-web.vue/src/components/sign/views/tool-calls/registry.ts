import type * as W from "@xieyuheng/windbell.ts/core"
import type { Component } from "vue"

import BashToolCallView from "./BashToolCallView.vue"
import DefaultToolCallView from "./DefaultToolCallView.vue"
import PwshToolCallView from "./PwshToolCallView.vue"

const toolCallViews: Partial<Record<string, Component>> = {
  bash: BashToolCallView,
  pwsh: PwshToolCallView,
}

export function resolveToolCallView(sign: W.ToolCallSign): Component {
  return toolCallViews[sign.name] ?? DefaultToolCallView
}
