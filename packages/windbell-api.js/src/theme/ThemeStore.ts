import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import Path from "node:path"
import { listFiles, readJsonFile, writeJsonFile } from "@windbell/semiosis.js"
import {
  isThemeId,
  parseTheme,
  themeIdPrefix,
  type Theme,
  type ThemeInput,
} from "./Theme.ts"

export type ThemeStoreOptions = {
  root: string
}

export type ThemeStore = {
  list(): Promise<Array<Theme>>
  get(id: string): Promise<Theme | undefined>
  create(input: ThemeInput): Promise<Theme>
  put(theme: Theme): Promise<void>
  remove(id: string): Promise<void>
}

export function makeThemeStore(options: ThemeStoreOptions): ThemeStore {
  const root = Path.resolve(options.root)

  const themePath = (id: string): string => {
    return Path.join(root, `${id}.json`)
  }

  return {
    async list() {
      const fileNames = await listFiles(root)
      const themes: Array<Theme> = []

      for (const fileName of fileNames) {
        if (!fileName.endsWith(".json")) continue

        const id = fileName.slice(0, -".json".length)
        if (!isThemeId(id)) continue

        const theme = await readThemeFile(themePath(id))
        if (theme === undefined) continue

        themes.push(theme)
      }

      return themes.sort(
        (left, right) =>
          left.name.localeCompare(right.name) ||
          left.id.localeCompare(right.id),
      )
    },

    async get(id) {
      if (!isThemeId(id)) return undefined
      return readThemeFile(themePath(id))
    },

    async create(input) {
      const id = `${themeIdPrefix}${randomUUID()}`
      const now = Date.now()
      const theme: Theme = {
        id,
        name: input.name,
        colors: input.colors,
        createdAt: now,
        updatedAt: now,
      }

      await this.put(theme)
      return theme
    },

    async put(theme) {
      if (!isThemeId(theme.id)) {
        throw new Error(`invalid theme id: ${theme.id}`)
      }

      await writeJsonFile(themePath(theme.id), theme)
    },

    async remove(id) {
      if (!isThemeId(id)) return
      await fs.rm(themePath(id), { force: true })
    },
  }
}

async function readThemeFile(path: string): Promise<Theme | undefined> {
  const value = await readJsonFile(path)
  if (value === undefined) return undefined

  const theme = parseTheme(value)
  if (theme === undefined) return undefined

  return theme
}
