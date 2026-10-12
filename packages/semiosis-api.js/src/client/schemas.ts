import type * as S from "@windbell/semiosis.js/node"
import { z } from "zod"

export type Health = {
  ok: boolean
  service: string
}

export const HealthSchema: z.ZodType<Health> = z.object({
  ok: z.boolean(),
  service: z.string(),
})

export type ProviderApiKeyStatus = {
  configured: boolean
}

export const ProviderApiKeyStatusSchema: z.ZodType<ProviderApiKeyStatus> =
  z.object({
    configured: z.boolean(),
  })

export const ProviderConfigSchema: z.ZodType<S.ProviderConfig> = z.object({
  name: z.string(),
  baseUrl: z.string(),
  defaultModel: z.string().nullable(),
})

export const ProviderConfigListSchema: z.ZodType<Array<S.ProviderConfig>> =
  z.array(ProviderConfigSchema)

const DeepSeekModelConfigSchema = z.object({
  name: z.string(),
  pinned: z.boolean(),
  thinking: z.enum(["enabled", "disabled"]),
  reasoningEffort: z.enum(["none", "low", "high", "max"]),
})

const DeepSeekModelInfoSchema: z.ZodType<S.DeepSeek.ModelInfo> = z.object({
  id: z.string(),
  object: z.literal("model"),
  owned_by: z.string(),
  name: z.string(),
  context_window: z.number(),
  max_output_tokens: z.number(),
  input_modalities: z.array(z.string()),
  output_modalities: z.array(z.string()),
  effort: z
    .object({
      supported_levels: z.array(z.string()),
      default_level: z.string().optional(),
    })
    .optional(),
  api_capabilities: z.record(z.string(), z.unknown()).optional(),
})

const OpenRouterReasoningSchema = z.object({
  effort: z.string().optional(),
  max_tokens: z.number().optional(),
  exclude: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

const OpenRouterModelConfigSchema = z.object({
  name: z.string(),
  pinned: z.boolean(),
  reasoning: OpenRouterReasoningSchema.nullable().optional(),
  provider: z.record(z.string(), z.unknown()).nullable().optional(),
  extraBody: z.record(z.string(), z.unknown()).optional(),
})

const OpenRouterAliasTargetSchema = z.object({
  name: z.string(),
  slug: z.string(),
})

const OpenRouterArtificialAnalysisSchema = z.object({
  intelligence_index: z.number().nullable().optional(),
  coding_index: z.number().nullable().optional(),
  agentic_index: z.number().nullable().optional(),
})

const OpenRouterBenchmarksSchema = z.object({
  design_arena: z.array(z.unknown()).optional(),
  artificial_analysis: OpenRouterArtificialAnalysisSchema.optional(),
})

const OpenRouterModelInfoSchema: z.ZodType<S.OpenRouter.ModelInfo> = z.object({
  id: z.string(),
  canonical_slug: z.string().nullable().optional(),
  hugging_face_id: z.string().nullable().optional(),
  name: z.string(),
  created: z.number().optional(),
  description: z.string().optional(),
  context_length: z.number(),
  alias_target: OpenRouterAliasTargetSchema.nullable().optional(),
  benchmarks: OpenRouterBenchmarksSchema.nullable().optional(),
  architecture: z.object({
    modality: z.string().optional(),
    input_modalities: z.array(z.string()),
    output_modalities: z.array(z.string()),
    tokenizer: z.string().nullable().optional(),
    instruct_type: z.string().nullable().optional(),
  }),
  pricing: z.record(z.string(), z.unknown()),
  top_provider: z
    .object({
      context_length: z.number().nullable().optional(),
      max_completion_tokens: z.number().nullable().optional(),
      is_moderated: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  per_request_limits: z.unknown().optional(),
  supported_parameters: z.array(z.string()),
  default_parameters: z.record(z.string(), z.unknown()).nullable().optional(),
  supported_voices: z.unknown().optional(),
  knowledge_cutoff: z.string().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  links: z
    .object({
      details: z.string().optional(),
    })
    .nullable()
    .optional(),
  reasoning: z
    .object({
      mandatory: z.boolean().optional(),
      default_enabled: z.boolean().optional(),
      supported_efforts: z.array(z.string()).optional(),
      default_effort: z.string().nullable().optional(),
      supports_max_tokens: z.boolean().optional(),
    })
    .nullable()
    .optional(),
})

const DeepSeekProviderModelEntrySchema: z.ZodType<S.DeepSeekProviderModelEntry> =
  z.object({
    providerName: z.literal("deepseek"),
    name: z.string(),
    pinned: z.boolean(),
    isDefault: z.boolean(),
    config: DeepSeekModelConfigSchema.nullable(),
    info: DeepSeekModelInfoSchema.nullable(),
  })

const OpenRouterProviderModelEntrySchema: z.ZodType<S.OpenRouterProviderModelEntry> =
  z.object({
    providerName: z.literal("openrouter"),
    name: z.string(),
    pinned: z.boolean(),
    isDefault: z.boolean(),
    config: OpenRouterModelConfigSchema.nullable(),
    info: OpenRouterModelInfoSchema.nullable(),
  })

export const ProviderModelEntrySchema: z.ZodType<S.ProviderModelEntry> =
  z.union([
    DeepSeekProviderModelEntrySchema,
    OpenRouterProviderModelEntrySchema,
  ])

export const ProviderModelEntryListSchema: z.ZodType<
  Array<S.ProviderModelEntry>
> = z.array(ProviderModelEntrySchema)

export const SettingsSchema: z.ZodType<S.Settings> = z.object({
  defaultProvider: z.string().nullable(),
  themeId: z.string().nullable(),
})

const WorkspaceFields = {
  id: z.string(),
  name: z.string(),
  root: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
}

export const WorkspaceSchema: z.ZodType<S.Workspace> = z.object(WorkspaceFields)

export const WorkspaceListSchema: z.ZodType<Array<S.Workspace>> =
  z.array(WorkspaceSchema)

export const DustbinWorkspaceSchema: z.ZodType<S.DustbinWorkspace> = z.object({
  ...WorkspaceFields,
  deletedAt: z.number(),
})

export const DustbinWorkspaceListSchema: z.ZodType<Array<S.DustbinWorkspace>> =
  z.array(DustbinWorkspaceSchema)

const PersonaSignSchema: z.ZodType<S.PersonaSign> = z.object({
  kind: z.literal("PersonaSign"),
  content: z.string(),
})

const UserSignSchema: z.ZodType<S.UserSign> = z.object({
  kind: z.literal("UserSign"),
  content: z.string(),
})

const ReasoningSignSchema: z.ZodType<S.ReasoningSign> = z.object({
  kind: z.literal("ReasoningSign"),
  content: z.string(),
})

const AssistantSignSchema: z.ZodType<S.AssistantSign> = z.object({
  kind: z.literal("AssistantSign"),
  content: z.string(),
})

const ProviderDataSignSchema: z.ZodType<S.ProviderDataSign> = z.object({
  kind: z.literal("ProviderDataSign"),
  provider: z.string(),
  field: z.string(),
  data: z.unknown(),
})

const ToolSignSchema: z.ZodType<S.ToolSign> = z.object({
  kind: z.literal("ToolSign"),
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()),
})

const ToolCallSignSchema: z.ZodType<S.ToolCallSign> = z.object({
  kind: z.literal("ToolCallSign"),
  callId: z.string(),
  name: z.string(),
  arguments: z.string(),
})

const ToolOutputSignSchema: z.ZodType<S.ToolOutputSign> = z.object({
  kind: z.literal("ToolOutputSign"),
  callId: z.string(),
  content: z.string(),
})

export const SignSchema: z.ZodType<S.Sign> = z.union([
  PersonaSignSchema,
  UserSignSchema,
  ReasoningSignSchema,
  AssistantSignSchema,
  ProviderDataSignSchema,
  ToolSignSchema,
  ToolCallSignSchema,
  ToolOutputSignSchema,
])

const SessionIndexFields = {
  id: z.string(),
  workspaceId: z.string(),
  title: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
}

export const SessionIndexSchema: z.ZodType<S.SessionIndex> =
  z.object(SessionIndexFields)

export const SessionIndexListSchema: z.ZodType<Array<S.SessionIndex>> =
  z.array(SessionIndexSchema)

export const SessionSchema: z.ZodType<S.Session> = z.object({
  ...SessionIndexFields,
  context: z.array(SignSchema),
})

export const DustbinSessionIndexSchema: z.ZodType<S.DustbinSessionIndex> =
  z.object({
    ...SessionIndexFields,
    deletedAt: z.number(),
    trashedWithWorkspace: z.boolean().optional(),
  })

export const DustbinSessionIndexListSchema: z.ZodType<
  Array<S.DustbinSessionIndex>
> = z.array(DustbinSessionIndexSchema)

export type GenerateTitleOutput = string

export const GenerateTitleOutputSchema: z.ZodType<GenerateTitleOutput> = z
  .object({ title: z.string() })
  .transform((value) => value.title)

export const VoidSchema: z.ZodType<void> = z
  .null()
  .transform((): void => undefined)
