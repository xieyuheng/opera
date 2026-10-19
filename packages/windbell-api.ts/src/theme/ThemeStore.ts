import { randomUUID } from "node:crypto"
import Path from "node:path"

import type * as S from "@windbell/semiosis.ts"
import { unwrap } from "@windbell/std.ts/result"

import {
  isThemeId,
  parseTheme,
  themeIdPrefix,
  type Theme,
  type ThemeInput,
} from "./Theme.ts"

export type ThemeStoreOptions = {
  files: S.Database["files"]
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
      const fileNames = unwrap(await options.files.listFiles(root))
      const themes: Array<Theme> = []

      for (const fileName of fileNames) {
        if (!fileName.endsWith(".json")) continue

        const id = fileName.slice(0, -".json".length)
        if (!isThemeId(id)) continue

        const theme = await readThemeFile(options.files, themePath(id))
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
      return readThemeFile(options.files, themePath(id))
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

      unwrap(await options.files.writeJsonFile(themePath(theme.id), theme))
    },

    async remove(id) {
      if (!isThemeId(id)) return
      unwrap(await options.files.remove(themePath(id)))
    },
  }
}

async function readThemeFile(
  files: S.Database["files"],
  path: string,
): Promise<Theme | undefined> {
  const value = unwrap(await files.readJsonFile(path))
  if (value === undefined) return undefined

  const theme = parseTheme(value)
  if (theme === undefined) return undefined

  return theme
}
