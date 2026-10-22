export type Sign =
  | PersonaSign
  | UserSign
  | ReasoningSign
  | AssistantSign
  | ProviderDataSign
  | ToolSign
  | ToolCallSign
  | ToolOutputSign

export type PersonaSign = {
  kind: "PersonaSign"
  content: string
}

export function PersonaSign(content: string): PersonaSign {
  return {
    kind: "PersonaSign",
    content,
  }
}

export function isPersonaSign(value: Sign): value is PersonaSign {
  return value.kind === "PersonaSign"
}

export function asPersonaSign(value: Sign): PersonaSign {
  if (isPersonaSign(value)) return value
  throw new Error(`[asPersonaSign] fail on: ${value.kind}`)
}

export type UserSign = {
  kind: "UserSign"
  content: string
}

export function UserSign(content: string): UserSign {
  return {
    kind: "UserSign",
    content,
  }
}

export function isUserSign(value: Sign): value is UserSign {
  return value.kind === "UserSign"
}

export function asUserSign(value: Sign): UserSign {
  if (isUserSign(value)) return value
  throw new Error(`[asUserSign] fail on: ${value.kind}`)
}

export type ReasoningSign = {
  kind: "ReasoningSign"
  content: string
}

export function ReasoningSign(content: string): ReasoningSign {
  return {
    kind: "ReasoningSign",
    content,
  }
}

export function isReasoningSign(value: Sign): value is ReasoningSign {
  return value.kind === "ReasoningSign"
}

export function asReasoningSign(value: Sign): ReasoningSign {
  if (isReasoningSign(value)) return value
  throw new Error(`[asReasoningSign] fail on: ${value.kind}`)
}

export type AssistantSign = {
  kind: "AssistantSign"
  content: string
}

export function AssistantSign(content: string): AssistantSign {
  return {
    kind: "AssistantSign",
    content,
  }
}

export function isAssistantSign(value: Sign): value is AssistantSign {
  return value.kind === "AssistantSign"
}

export function asAssistantSign(value: Sign): AssistantSign {
  if (isAssistantSign(value)) return value
  throw new Error(`[asAssistantSign] fail on: ${value.kind}`)
}

export type ProviderDataSign = {
  kind: "ProviderDataSign"
  provider: string
  field: string
  data: unknown
}

export function ProviderDataSign(
  input: Omit<ProviderDataSign, "kind">,
): ProviderDataSign {
  return {
    kind: "ProviderDataSign",
    ...input,
  }
}

export function isProviderDataSign(value: Sign): value is ProviderDataSign {
  return value.kind === "ProviderDataSign"
}

export function asProviderDataSign(value: Sign): ProviderDataSign {
  if (isProviderDataSign(value)) return value
  throw new Error(`[asProviderDataSign] fail on: ${value.kind}`)
}

export type ToolSign = {
  kind: "ToolSign"
  name: string
  description: string
  parameters: Record<string, unknown>
}

export function ToolSign(
  name: string,
  description: string,
  parameters: Record<string, unknown>,
): ToolSign {
  return {
    kind: "ToolSign",
    name,
    description,
    parameters,
  }
}

export function isToolSign(value: Sign): value is ToolSign {
  return value.kind === "ToolSign"
}

export function asToolSign(value: Sign): ToolSign {
  if (isToolSign(value)) return value
  throw new Error(`[asToolSign] fail on: ${value.kind}`)
}

export type ToolCallSign = {
  kind: "ToolCallSign"
  callId: string
  name: string
  arguments: string
}

export function ToolCallSign(input: Omit<ToolCallSign, "kind">): ToolCallSign {
  return {
    kind: "ToolCallSign",
    ...input,
  }
}

export function isToolCallSign(value: Sign): value is ToolCallSign {
  return value.kind === "ToolCallSign"
}

export function asToolCallSign(value: Sign): ToolCallSign {
  if (isToolCallSign(value)) return value
  throw new Error(`[asToolCallSign] fail on: ${value.kind}`)
}

export type ToolOutputSign = {
  kind: "ToolOutputSign"
  callId: string
  content: string
}

export function ToolOutputSign(
  callId: string,
  content: string,
): ToolOutputSign {
  return {
    kind: "ToolOutputSign",
    callId,
    content,
  }
}

export function isToolOutputSign(value: Sign): value is ToolOutputSign {
  return value.kind === "ToolOutputSign"
}

export function asToolOutputSign(value: Sign): ToolOutputSign {
  if (isToolOutputSign(value)) return value
  throw new Error(`[asToolOutputSign] fail on: ${value.kind}`)
}
