import { windbell } from "./windbell"
import { computed, reactive, watch } from "vue"
import { useColorMode, type ColorMode } from "./color-mode.ts"

export const defaultThemeId = "builtin-default"

export const themeColorTokens = [
  "paper",
  "ink",
  "line",
  "sign-persona",
  "sign-user",
  "sign-reasoning",
  "sign-assistant",
  "sign-provider-data",
  "sign-tool-call",
  "sign-tool",
  "sign-tool-output",
  "sign-error",
] as const

export type ThemeColorName = (typeof themeColorTokens)[number]
export type ThemeModeColors = Record<string, string>

export type Theme = {
  id: string
  name: string
  colors: {
    light: ThemeModeColors
    dark: ThemeModeColors
  }
  createdAt?: number
  updatedAt?: number
}

export type ThemeInput = {
  name: string
  colors: Theme["colors"]
}

export const builtInThemes: Array<Theme> = [
  {
    id: defaultThemeId,
    name: "Default",
    colors: {
      light: {
        paper: "#fafaf9",
        ink: "#1f1f1e",
        line: "#e4e4e1",
        "sign-persona": "oklch(0.92 0.04 310)",
        "sign-user": "oklch(0.92 0.04 213)",
        "sign-reasoning": "oklch(0.92 0.04 294)",
        "sign-assistant": "oklch(0.92 0.04 153)",
        "sign-provider-data": "oklch(0.92 0.04 273)",
        "sign-tool-call": "oklch(0.92 0.04 96)",
        "sign-tool": "oklch(0.92 0.04 253)",
        "sign-tool-output": "oklch(0.92 0.04 83)",
        "sign-error": "oklch(0.92 0.04 17)",
      },
      dark: {
        paper: "#181818",
        ink: "#f2f2f1",
        line: "#343434",
        "sign-persona": "oklch(0.4 0.2 310)",
        "sign-user": "oklch(0.4 0.2 213)",
        "sign-reasoning": "oklch(0.4 0.2 294)",
        "sign-assistant": "oklch(0.4 0.2 153)",
        "sign-provider-data": "oklch(0.4 0.2 273)",
        "sign-tool-call": "oklch(0.4 0.2 96)",
        "sign-tool": "oklch(0.4 0.2 253)",
        "sign-tool-output": "oklch(0.4 0.2 83)",
        "sign-error": "oklch(0.4 0.2 17)",
      },
    },
  },
]

export type ThemeState = {
  customThemes: Array<Theme>
  activeThemeId: string
  loading: boolean
  error: string | undefined
}

const state = reactive<ThemeState>({
  customThemes: [],
  activeThemeId: defaultThemeId,
  loading: true,
  error: undefined,
})

const activeTheme = computed<Theme>(() => {
  return findThemeById(state.activeThemeId) ?? builtInThemes[0]!
})

const colorMode = useColorMode()
let previewTheme: Theme | undefined

export function findThemeById(themeId: string): Theme | undefined {
  return (
    builtInThemes.find((theme) => theme.id === themeId) ??
    state.customThemes.find((theme) => theme.id === themeId)
  )
}

export function isBuiltInTheme(themeId: string): boolean {
  return builtInThemes.some((theme) => theme.id === themeId)
}

const THEME_CACHE_STORAGE_KEY = "windbell.theme"

function isThemeModeColors(value: unknown): value is ThemeModeColors {
  if (value === null || typeof value !== "object" || value instanceof Array) {
    return false
  }

  const record = value as Record<string, unknown>
  for (const token of themeColorTokens) {
    if (typeof record[token] !== "string") return false
  }

  return true
}

function isCachedTheme(value: unknown): value is Theme {
  if (value === null || typeof value !== "object" || value instanceof Array) {
    return false
  }

  const record = value as Record<string, unknown>
  const colors = record.colors
  if (
    colors === null ||
    typeof colors !== "object" ||
    colors instanceof Array
  ) {
    return false
  }

  const colorRecord = colors as Record<string, unknown>
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    isThemeModeColors(colorRecord.light) &&
    isThemeModeColors(colorRecord.dark)
  )
}

function clearCachedTheme(): void {
  localStorage.removeItem(THEME_CACHE_STORAGE_KEY)
}

function readCachedTheme(): Theme | undefined {
  const raw = localStorage.getItem(THEME_CACHE_STORAGE_KEY)
  if (raw === null) return undefined

  try {
    const value: unknown = JSON.parse(raw)
    if (isCachedTheme(value)) return value
  } catch {
    // ignore invalid cache
  }

  clearCachedTheme()
  return undefined
}

function writeCachedTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_CACHE_STORAGE_KEY, JSON.stringify(theme))
  } catch {
    // ignore storage errors
  }
}

function applyCachedTheme(theme: Theme): void {
  if (isBuiltInTheme(theme.id)) {
    state.customThemes = []
  } else {
    state.customThemes = [theme]
  }

  state.activeThemeId = theme.id
  applyCurrentTheme()
}

function applyThemeFromStorageEvent(): void {
  const theme = readCachedTheme()
  if (theme === undefined) return

  if (!isBuiltInTheme(theme.id)) {
    const index = state.customThemes.findIndex((item) => item.id === theme.id)
    if (index === -1) {
      state.customThemes = [theme, ...state.customThemes]
    } else {
      state.customThemes.splice(index, 1, theme)
    }

    void refreshCustomThemes().catch((error) => {
      state.error = error instanceof Error ? error.message : String(error)
    })
  }

  state.activeThemeId = theme.id
  state.error = undefined
  applyCurrentTheme()
}

window.addEventListener("storage", (event) => {
  if (event.key !== THEME_CACHE_STORAGE_KEY) return
  if (event.newValue === null) return

  applyThemeFromStorageEvent()
})

export function applyTheme(theme: Theme, resolved: ColorMode): void {
  const colors = theme.colors[resolved]

  for (const token of themeColorTokens) {
    const value = colors[token]
    if (typeof value !== "string" || value.trim() === "") continue

    document.documentElement.style.setProperty(`--color-${token}`, value)
  }

  document.documentElement.dataset.theme = theme.id
}

function applyCurrentTheme(): void {
  applyTheme(previewTheme ?? activeTheme.value, colorMode.resolved)
}

watch([activeTheme, () => colorMode.resolved], () => applyCurrentTheme(), {
  immediate: true,
})

let initializePromise: Promise<void> | undefined
let themeDataPromise: Promise<void> | undefined

export function ensureThemeReady(): Promise<void> {
  if (initializePromise !== undefined) return initializePromise

  const cachedTheme = readCachedTheme()

  if (cachedTheme !== undefined) {
    applyCachedTheme(cachedTheme)
    state.loading = false
    themeDataPromise = refreshThemeFromDatabase()
    initializePromise = Promise.resolve()
    return initializePromise
  }

  themeDataPromise = refreshThemeFromDatabase()
  initializePromise = themeDataPromise
  return initializePromise
}

export function waitForThemeData(): Promise<void> {
  if (themeDataPromise === undefined) {
    void ensureThemeReady()
  }

  return themeDataPromise ?? Promise.resolve()
}

async function refreshThemeFromDatabase(): Promise<void> {
  state.loading = true
  state.error = undefined

  try {
    const [settings, customThemes] = await Promise.all([
      windbell.settings.get(),
      windbell.themes.list(),
    ])

    state.customThemes = customThemes
    const selectedThemeId = settings.themeId ?? defaultThemeId
    const selectedTheme = findThemeById(selectedThemeId) ?? builtInThemes[0]!
    state.activeThemeId = selectedTheme.id
    writeCachedTheme(selectedTheme)
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error)

    if (readCachedTheme() === undefined) {
      state.activeThemeId = defaultThemeId
    }
  } finally {
    state.loading = false
  }

  applyCurrentTheme()
}

export async function activateTheme(themeId: string): Promise<void> {
  const theme = findThemeById(themeId)
  if (theme === undefined) {
    throw new Error(`theme not found: ${themeId}`)
  }

  state.activeThemeId = theme.id
  applyCurrentTheme()

  try {
    const settings = await windbell.settings.get()
    await windbell.settings.put({
      ...settings,
      themeId: theme.id,
    })
    writeCachedTheme(theme)
    state.error = undefined
  } catch (error) {
    state.error = error instanceof Error ? error.message : String(error)
    throw error
  }
}

export async function refreshCustomThemes(): Promise<void> {
  state.customThemes = await windbell.themes.list()
}

export async function createCustomTheme(input: ThemeInput): Promise<Theme> {
  assertThemeInput(input)
  const theme = await windbell.themes.create(input)
  state.customThemes = [...state.customThemes, theme]
  return theme
}

export async function updateCustomTheme(theme: Theme): Promise<Theme> {
  if (isBuiltInTheme(theme.id)) {
    throw new Error("built-in theme cannot be modified")
  }

  assertThemeInput({ name: theme.name, colors: theme.colors })
  const updated = await windbell.themes.put({
    themeId: theme.id,
    theme: {
      name: theme.name,
      colors: theme.colors,
    },
  })
  const index = state.customThemes.findIndex((item) => item.id === theme.id)

  if (index === -1) {
    state.customThemes = [...state.customThemes, updated]
  } else {
    state.customThemes.splice(index, 1, updated)
  }

  if (state.activeThemeId === updated.id) {
    writeCachedTheme(updated)
  }

  return updated
}

export async function deleteCustomTheme(themeId: string): Promise<void> {
  if (isBuiltInTheme(themeId)) {
    throw new Error("built-in theme cannot be deleted")
  }

  await windbell.themes.remove(themeId)
  state.customThemes = state.customThemes.filter(
    (theme) => theme.id !== themeId,
  )

  if (state.activeThemeId === themeId) {
    await activateTheme(defaultThemeId)
  }
}

export function setPreviewTheme(theme: Theme | undefined): void {
  previewTheme = theme
  applyCurrentTheme()
}

function assertThemeInput(input: ThemeInput): void {
  if (input.name.trim() === "") {
    throw new Error("theme name is empty")
  }

  assertThemeColors(input.colors.light, "light")
  assertThemeColors(input.colors.dark, "dark")
}

function assertThemeColors(colors: ThemeModeColors, mode: string): void {
  for (const token of themeColorTokens) {
    const value = colors[token]
    if (typeof value !== "string" || value.trim() === "") {
      throw new Error(`theme color is empty: ${mode}.${token}`)
    }

    if (typeof CSS !== "undefined" && CSS.supports("color", value) === false) {
      throw new Error(`invalid theme color: ${mode}.${token} = ${value}`)
    }
  }
}

export function useTheme() {
  return {
    state,
    activeTheme,
    builtInThemes,
    activateTheme,
    createCustomTheme,
    updateCustomTheme,
    deleteCustomTheme,
    refreshCustomThemes,
    setPreviewTheme,
  }
}
