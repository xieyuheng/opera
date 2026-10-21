import type { Sign } from "./Sign.ts"

export type SignPreview = {
  kind: Sign["kind"]
  truncatedContent: string
}

export const signPreviewContentMaxLength = 200

export function makeSignPreview(
  sign: Sign,
  maxLength = signPreviewContentMaxLength,
): SignPreview {
  return {
    kind: sign.kind,
    truncatedContent: truncateContent(signPreviewContent(sign), maxLength),
  }
}

function signPreviewContent(sign: Sign): string {
  switch (sign.kind) {
    case "PersonaSign":
    case "UserSign":
    case "ReasoningSign":
    case "AssistantSign": {
      return sign.content
    }

    case "ProviderDataSign": {
      return stringify(sign.data)
    }

    case "ToolSign": {
      return `${sign.name} ${sign.description}`
    }

    case "ToolCallSign": {
      return `${sign.name} ${sign.arguments}`
    }

    case "ToolOutputSign": {
      return sign.content
    }
  }
}

function stringify(value: unknown): string {
  return JSON.stringify(value, null, 2) ?? String(value)
}

function truncateContent(content: string, maxLength: number): string {
  const normalized = content.replace(/\s+/g, " ").trim()

  if (normalized.length <= maxLength) return normalized
  if (maxLength <= 0) return ""

  return `${normalized.slice(0, maxLength - 1)}…`
}
