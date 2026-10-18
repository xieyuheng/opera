import {
  AssistantSign,
  PersonaSign,
  ReasoningSign,
  UserSign,
  type Sign,
} from "../sign/index.ts"

export type SignFileInfo = {
  sequence: number
  kind: Sign["kind"]
  extension: ".md" | ".json"
}

export const signTypeNameByKind = {
  PersonaSign: "persona",
  UserSign: "user",
  ReasoningSign: "reasoning",
  AssistantSign: "assistant",
  ProviderDataSign: "provider-data",
  ToolCallSign: "tool-call",
  ToolSign: "tool",
  ToolOutputSign: "tool-output",
} as const satisfies Record<Sign["kind"], string>

const signKindByTypeName = {
  persona: "PersonaSign",
  user: "UserSign",
  reasoning: "ReasoningSign",
  assistant: "AssistantSign",
  "provider-data": "ProviderDataSign",
  "tool-call": "ToolCallSign",
  tool: "ToolSign",
  "tool-output": "ToolOutputSign",
} as const satisfies Record<string, Sign["kind"]>

export function signKindToTypeName(kind: Sign["kind"]): string {
  return signTypeNameByKind[kind]
}

export function signFileExtension(sign: Sign): ".md" | ".json" {
  switch (sign.kind) {
    case "PersonaSign":
    case "UserSign":
    case "ReasoningSign":
    case "AssistantSign":
      return ".md"

    case "ProviderDataSign":
    case "ToolCallSign":
    case "ToolSign":
    case "ToolOutputSign":
      return ".json"
  }
}

export function formatSignFileName(sequence: number, sign: Sign): string {
  const prefix = String(sequence).padStart(4, "0")
  const typeName = signKindToTypeName(sign.kind)
  const extension = signFileExtension(sign)
  return `${prefix}-${typeName}${extension}`
}

export function serializeSign(sign: Sign): string {
  switch (sign.kind) {
    case "PersonaSign":
    case "UserSign":
    case "ReasoningSign":
    case "AssistantSign":
      return sign.content

    case "ProviderDataSign":
    case "ToolCallSign":
    case "ToolSign":
    case "ToolOutputSign":
      return `${JSON.stringify(sign, null, 2)}\n`
  }
}

export function parseSignFileName(fileName: string): SignFileInfo | undefined {
  const match = /^([0-9]+)-(.*)\.(md|json)$/.exec(fileName)
  if (match === null) return undefined

  const sequenceText = match[1]
  const typeName = match[2]
  const extension = match[3]

  if (
    sequenceText === undefined ||
    typeName === undefined ||
    extension === undefined
  ) {
    return undefined
  }

  const kind = signKindByTypeName[typeName as keyof typeof signKindByTypeName]
  if (kind === undefined) return undefined

  return {
    sequence: Number(sequenceText),
    kind,
    extension: `.${extension}` as ".md" | ".json",
  }
}

export function parseSign(fileName: string, text: string): Sign {
  const info = parseSignFileName(fileName)
  if (info === undefined) {
    throw new Error(`[signFile] invalid sign file name: ${fileName}`)
  }

  if (info.extension === ".json") {
    const value: unknown = JSON.parse(text)

    if (typeof value !== "object" || value === null || value instanceof Array) {
      throw new Error(`[signFile] invalid json sign: ${fileName}`)
    }

    const kind = (value as { kind?: unknown }).kind
    if (kind !== info.kind) {
      throw new Error(
        `[signFile] sign kind mismatch: ${fileName}, expected ${info.kind}, got ${String(kind)}`,
      )
    }

    return value as Sign
  }

  switch (info.kind) {
    case "PersonaSign":
      return PersonaSign(text)

    case "UserSign":
      return UserSign(text)

    case "ReasoningSign":
      return ReasoningSign(text)

    case "AssistantSign":
      return AssistantSign(text)

    case "ProviderDataSign":
    case "ToolCallSign":
    case "ToolSign":
    case "ToolOutputSign":
      throw new Error(`[signFile] structured sign must use .json: ${fileName}`)
  }
}
