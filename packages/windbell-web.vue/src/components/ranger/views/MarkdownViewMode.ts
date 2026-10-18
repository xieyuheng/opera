export type MarkdownViewMode = "render" | "source"

const storageKey = "windbell.ranger.markdownViewMode"

export function readStoredMarkdownViewMode(): MarkdownViewMode {
  try {
    return localStorage.getItem(storageKey) === "source" ? "source" : "render"
  } catch {
    return "render"
  }
}

export function writeStoredMarkdownViewMode(mode: MarkdownViewMode): void {
  try {
    localStorage.setItem(storageKey, mode)
  } catch {
    // ignore storage errors
  }
}
