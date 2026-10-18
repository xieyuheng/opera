import fs from "node:fs"
import Path from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import type { Sign } from "../sign/index.ts"
import { makeMockModel, type MockModel } from "./makeMockModel.ts"

const signSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("PersonaSign"),
    content: z.string(),
  }),
  z.object({
    kind: z.literal("UserSign"),
    content: z.string(),
  }),
  z.object({
    kind: z.literal("ReasoningSign"),
    content: z.string(),
  }),
  z.object({
    kind: z.literal("AssistantSign"),
    content: z.string(),
  }),
  z.object({
    kind: z.literal("ProviderDataSign"),
    provider: z.string(),
    field: z.string(),
    data: z.unknown(),
  }),
  z.object({
    kind: z.literal("ToolCallSign"),
    callId: z.string(),
    name: z.string(),
    arguments: z.string(),
  }),
  z.object({
    kind: z.literal("ToolSign"),
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.string(), z.unknown()),
  }),
  z.object({
    kind: z.literal("ToolOutputSign"),
    callId: z.string(),
    content: z.string(),
  }),
])

const modelOutputSchema = z.array(signSchema)

export function readMockModel(name: string): MockModel {
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(`[readMockModel] invalid model name: ${name}`)
  }

  const path = mockModelPath(name)
  const text = readMockModelFile(path)
  const outputs: Array<Array<Sign>> = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "")
    .map((line, index) => parseMockSigns(path, line, index + 1))

  return makeMockModel({ providerName: "mock", name }, outputs)
}

function mockModelPath(name: string): string {
  const currentDir = Path.dirname(fileURLToPath(import.meta.url))
  return Path.join(currentDir, "..", "..", "mock", "models", `${name}.jsonl`)
}

function readMockModelFile(path: string): string {
  try {
    return fs.readFileSync(path, "utf8")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[readMockModel] fail to read model file: ${path}\n  ${message}`,
    )
  }
}

function parseMockSigns(
  path: string,
  text: string,
  lineNumber: number,
): Array<Sign> {
  const value = parseMockSignsJson(path, text, lineNumber)
  const result = modelOutputSchema.safeParse(value)

  if (!result.success) {
    throw new Error(
      `[readMockModel] invalid model output: ${path}:${lineNumber}\n  ${result.error.message}`,
    )
  }

  return result.data
}

function parseMockSignsJson(
  path: string,
  text: string,
  lineNumber: number,
): unknown {
  try {
    return JSON.parse(text)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(
      `[readMockModel] invalid JSON: ${path}:${lineNumber}\n  ${message}`,
    )
  }
}
