import type * as S from "@windbell/semiosis.js"

export function signBody(sign: S.Sign): string {
  switch (sign.kind) {
    case "PersonaSign":
    case "UserSign":
    case "ReasoningSign":
    case "AssistantSign": {
      return sign.content
    }

    case "ProviderDataSign": {
      return JSON.stringify(sign.data, null, 2)
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
