import type { ModelEntry } from "./ModelEntry.ts"

export function modelEntryContextWindow(
  entry: ModelEntry,
): number | undefined {
  switch (entry.providerName) {
    case "deepseek":
      return entry.info?.context_window

    case "openrouter":
      return (
        entry.info?.context_length ??
        entry.info?.top_provider?.context_length ??
        undefined
      )
  }
}
