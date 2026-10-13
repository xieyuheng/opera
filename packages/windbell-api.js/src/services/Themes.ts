import { err, ok, type Result } from "@windbell/std.js/result"
import type { ServiceError } from "../errors/ServiceError.ts"
import type { Theme, ThemeInput } from "../theme/Theme.ts"
import type { ThemeStore } from "../theme/ThemeStore.ts"

export type ThemesServiceOptions = {
  store: ThemeStore
}

export function ListThemes(options: ThemesServiceOptions) {
  return async (): Promise<Result<Array<Theme>, ServiceError>> => {
    return ok(await options.store.list())
  }
}

export function GetTheme(options: ThemesServiceOptions) {
  return async (input: {
    themeId: string
  }): Promise<Result<Theme, ServiceError>> => {
    const theme = await options.store.get(input.themeId)

    if (theme === undefined) {
      return err({
        type: "theme-not-found",
        status: 404,
        message: "theme not found",
        info: { themeId: input.themeId },
      })
    }

    return ok(theme)
  }
}

export function CreateTheme(options: ThemesServiceOptions) {
  return async (input: ThemeInput): Promise<Result<Theme, ServiceError>> => {
    return ok(await options.store.create(input))
  }
}

export function PutTheme(options: ThemesServiceOptions) {
  return async (input: {
    themeId: string
    theme: ThemeInput
  }): Promise<Result<Theme, ServiceError>> => {
    const current = await options.store.get(input.themeId)

    if (current === undefined) {
      return err({
        type: "theme-not-found",
        status: 404,
        message: "theme not found",
        info: { themeId: input.themeId },
      })
    }

    const theme: Theme = {
      id: input.themeId,
      name: input.theme.name,
      colors: input.theme.colors,
      createdAt: current.createdAt,
      updatedAt: Date.now(),
    }

    await options.store.put(theme)
    return ok(theme)
  }
}

export function RemoveTheme(options: ThemesServiceOptions) {
  return async (input: {
    themeId: string
  }): Promise<Result<null, ServiceError>> => {
    const current = await options.store.get(input.themeId)

    if (current === undefined) {
      return err({
        type: "theme-not-found",
        status: 404,
        message: "theme not found",
        info: { themeId: input.themeId },
      })
    }

    await options.store.remove(input.themeId)
    return ok(null)
  }
}
