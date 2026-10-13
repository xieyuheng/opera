import type { Component } from "vue"
import type * as S from "@windbell/semiosis.js"
import SignMarkdownView from "./SignMarkdownView.vue"
import SignProviderDataView from "./SignProviderDataView.vue"
import SignToolCallView from "./SignToolCallView.vue"
import SignToolOutputView from "./SignToolOutputView.vue"
import SignToolView from "./SignToolView.vue"
import SignUnsupportedView from "./SignUnsupportedView.vue"

export type SignViewConfig = {
  component: Component
  labelKey: string
  color: string
}

const signViews = {
  PersonaSign: {
    component: SignMarkdownView,
    labelKey: "signKind.persona",
    color: "var(--color-sign-persona)",
  },
  UserSign: {
    component: SignMarkdownView,
    labelKey: "signKind.user",
    color: "var(--color-sign-user)",
  },
  ReasoningSign: {
    component: SignMarkdownView,
    labelKey: "signKind.reasoning",
    color: "var(--color-sign-reasoning)",
  },
  AssistantSign: {
    component: SignMarkdownView,
    labelKey: "signKind.assistant",
    color: "var(--color-sign-assistant)",
  },
  ProviderDataSign: {
    component: SignProviderDataView,
    labelKey: "signKind.providerData",
    color: "var(--color-sign-provider-data)",
  },
  ToolCallSign: {
    component: SignToolCallView,
    labelKey: "signKind.toolCall",
    color: "var(--color-sign-tool-call)",
  },
  ToolSign: {
    component: SignToolView,
    labelKey: "signKind.tool",
    color: "var(--color-sign-tool)",
  },
  ToolOutputSign: {
    component: SignToolOutputView,
    labelKey: "signKind.toolOutput",
    color: "var(--color-sign-tool-output)",
  },
} satisfies Record<S.Sign["kind"], SignViewConfig>

const unsupportedSignView: SignViewConfig = {
  component: SignUnsupportedView,
  labelKey: "signKind.error",
  color: "var(--color-sign-error)",
}

export function resolveSignView(sign: S.Sign): SignViewConfig {
  return signViews[sign.kind] ?? unsupportedSignView
}
