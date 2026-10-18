export type ModelConfig = {
  name: string
  pinned: boolean
  thinking: "enabled" | "disabled"
  reasoningEffort: "none" | "low" | "high" | "max"
}
