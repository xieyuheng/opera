import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import Path from "node:path"
import process from "node:process"

export function isEnoent(error: unknown): boolean {
  return (
    error instanceof Error && (error as NodeJS.ErrnoException).code === "ENOENT"
  )
}

export async function ensureDir(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true })
}

export async function listDirectories(path: string): Promise<Array<string>> {
  try {
    const entries = await fs.readdir(path, { withFileTypes: true })
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch (error) {
    if (isEnoent(error)) return []
    throw error
  }
}

export async function listFiles(path: string): Promise<Array<string>> {
  try {
    const entries = await fs.readdir(path, { withFileTypes: true })
    return entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  } catch (error) {
    if (isEnoent(error)) return []
    throw error
  }
}

export async function readTextFile(path: string): Promise<string | undefined> {
  try {
    return await fs.readFile(path, "utf8")
  } catch (error) {
    if (isEnoent(error)) return undefined
    throw error
  }
}

export async function writeTextFile(path: string, text: string): Promise<void> {
  await ensureDir(Path.dirname(path))

  const tempPath = `${path}.${process.pid}.${randomUUID()}.tmp`

  try {
    await fs.writeFile(tempPath, text)
    await fs.rename(tempPath, path)
  } catch (error) {
    await fs.rm(tempPath, { force: true })
    throw error
  }
}

export async function readJsonFile(path: string): Promise<unknown | undefined> {
  const text = await readTextFile(path)
  if (text === undefined) return undefined

  return JSON.parse(text)
}

export async function writeJsonFile(
  path: string,
  value: unknown,
): Promise<void> {
  await writeTextFile(path, `${JSON.stringify(value, null, 2)}\n`)
}
