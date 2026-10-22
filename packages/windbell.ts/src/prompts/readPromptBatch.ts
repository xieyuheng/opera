import fs from "node:fs"

export type PromptBatch = {
  system: string
  prompts: Array<string>
}

export function readPromptBatch(path: string): PromptBatch {
  const text = readPromptBatchFile(path)
    .replace(/\r\n/g, "\n")
    .split(/\n\s*---\s*\n/)
    .map((part) => part.trim())
    .filter((part) => part !== "")

  const [system, ...prompts] = text

  if (system === undefined) {
    throw new Error(`[readPromptBatch] missing system prompt: ${path}`)
  }

  if (prompts.length === 0) {
    throw new Error(`[readPromptBatch] missing user prompts: ${path}`)
  }

  return { system, prompts }
}

function readPromptBatchFile(path: string): string {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[readPromptBatch] fail to read prompts file: ${path}\n  ${message}`,
    )
  }
}
