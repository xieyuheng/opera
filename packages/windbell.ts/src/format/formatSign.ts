import type { Sign } from "../sign/index.ts"

export type FormatSignOptions = {
  color?: boolean
}

// Approximate the web sign card colors with xterm 256 colors.
// The web colors are defined by `--color-sign-*` in dark theme.
const signTagBackgroundByKind = {
  PersonaSign: 54,
  UserSign: 24,
  ReasoningSign: 55,
  AssistantSign: 22,
  ProviderDataSign: 60,
  ToolCallSign: 58,
  ToolSign: 25,
  ToolOutputSign: 94,
} as const satisfies Record<Sign["kind"], number>

const signTagForeground = "\x1b[38;5;255m"
const signTagReset = "\x1b[0m"

export function formatWithBackground(text: string, background: number): string {
  return `\x1b[48;5;${background}m${signTagForeground}${text}${signTagReset}`
}

export function formatSignTag(
  kind: Sign["kind"],
  text: string,
  options: FormatSignOptions = {},
): string {
  const tag = `[${text}]`
  if (options.color !== true) return tag

  return formatWithBackground(tag, signTagBackgroundByKind[kind])
}

export function formatSign(
  sign: Sign,
  options: FormatSignOptions = {},
): string {
  switch (sign.kind) {
    case "PersonaSign": {
      return `${formatSignTag(sign.kind, "persona", options)}\n\n${sign.content}\n`
    }

    case "UserSign": {
      return `${formatSignTag(sign.kind, "user", options)}\n\n${sign.content}\n`
    }

    case "ReasoningSign": {
      return `${formatSignTag(sign.kind, "reasoning", options)}\n\n${sign.content}\n`
    }

    case "AssistantSign": {
      return `${formatSignTag(sign.kind, "assistant", options)}\n\n${sign.content}\n`
    }

    case "ProviderDataSign": {
      return `${formatSignTag(sign.kind, "provider-data", options)}\n\n${JSON.stringify(sign.data, null, 2)}\n`
    }

    case "ToolCallSign": {
      const args = JSON.stringify(JSON.parse(sign.arguments), null, 2)
      return `${formatSignTag(sign.kind, "tool-call", options)}\n\n${sign.name}\n\n${args}\n`
    }

    case "ToolSign": {
      const parameters = JSON.stringify(sign.parameters, null, 2)
      return `${formatSignTag(sign.kind, "tool", options)}\n\n${sign.name}\n\n${sign.description}\n\n${parameters}\n`
    }

    case "ToolOutputSign": {
      return `${formatSignTag(sign.kind, "tool-output", options)}\n\n${sign.content}\n`
    }
  }
}
