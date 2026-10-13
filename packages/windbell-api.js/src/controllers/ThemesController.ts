import { z } from "zod"
import { makeAction } from "../http/makeAction.ts"
import type {
  CreateTheme,
  GetTheme,
  ListThemes,
  PutTheme,
  RemoveTheme,
} from "../services/Themes.ts"

export type ThemesControllerOptions = {
  listThemes: ReturnType<typeof ListThemes>
  getTheme: ReturnType<typeof GetTheme>
  createTheme: ReturnType<typeof CreateTheme>
  putTheme: ReturnType<typeof PutTheme>
  removeTheme: ReturnType<typeof RemoveTheme>
}

const ThemeColorRecordInputSchema = z.record(
  z.string(),
  z.string().trim().min(1),
)

export const ThemeInputSchema = z.object({
  name: z.string().trim().min(1),
  colors: z.object({
    light: ThemeColorRecordInputSchema,
    dark: ThemeColorRecordInputSchema,
  }),
})

export const GetThemeInputSchema = z.object({
  themeId: z.string(),
})

export const PutThemeInputSchema = z.object({
  themeId: z.string(),
  theme: ThemeInputSchema,
})

export const RemoveThemeInputSchema = z.object({
  themeId: z.string(),
})

export function makeThemesController(options: ThemesControllerOptions) {
  return {
    list: makeAction(z.object({}), () => options.listThemes()),

    get: makeAction(GetThemeInputSchema, (input) => options.getTheme(input)),

    create: makeAction(
      ThemeInputSchema,
      (input) => options.createTheme(input),
      { status: 201 },
    ),

    put: makeAction(PutThemeInputSchema, (input) => options.putTheme(input)),

    remove: makeAction(
      RemoveThemeInputSchema,
      (input) => options.removeTheme(input),
      { status: 204 },
    ),
  }
}
