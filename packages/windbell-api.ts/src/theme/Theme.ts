export type ThemeColors = {
  light: Record<string, string>
  dark: Record<string, string>
}

export type Theme = {
  id: string
  name: string
  colors: ThemeColors
  createdAt: number
  updatedAt: number
}

export type ThemeInput = {
  name: string
  colors: ThemeColors
}

export const themeIdPrefix = "theme-"

export function isThemeId(id: string): boolean {
  return id.startsWith(themeIdPrefix) && /^[a-zA-Z0-9_-]+$/.test(id)
}

export function parseTheme(value: unknown): Theme | undefined {
  if (value === null || typeof value !== "object" || value instanceof Array) {
    return undefined
  }

  const record = value as Record<string, unknown>
  const id = record.id
  const name = record.name
  const colors = record.colors
  const createdAt = record.createdAt
  const updatedAt = record.updatedAt

  if (typeof id !== "string" || !isThemeId(id)) return undefined
  if (typeof name !== "string" || name.trim() === "") return undefined
  if (typeof createdAt !== "number") return undefined
  if (typeof updatedAt !== "number") return undefined
  if (
    colors === null ||
    typeof colors !== "object" ||
    colors instanceof Array
  ) {
    return undefined
  }

  const colorRecord = colors as Record<string, unknown>
  const light = colorRecord.light
  const dark = colorRecord.dark

  if (!isStringRecord(light) || !isStringRecord(dark)) return undefined

  return {
    id,
    name,
    colors: {
      light,
      dark,
    },
    createdAt,
    updatedAt,
  }
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== "object" || value instanceof Array) {
    return false
  }

  for (const item of Object.values(value)) {
    if (typeof item !== "string" || item.trim() === "") return false
  }

  return true
}
