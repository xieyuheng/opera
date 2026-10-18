import { createI18n } from "vue-i18n"

export type Locale = "zh-CN" | "en-US"

export const supportedLocales: Array<{ value: Locale; label: string }> = [
  { value: "zh-CN", label: "中文" },
  { value: "en-US", label: "English" },
]

const LOCALE_STORAGE_KEY = "windbell.locale"

const messages = {
  "zh-CN": {
    app: {
      back: "返回",
      settings: "设置",
    },
  },
  "en-US": {
    app: {
      back: "Back",
      settings: "Settings",
    },
  },
}

function isLocale(value: string): value is Locale {
  return value === "zh-CN" || value === "en-US"
}

function getInitialLocale(): Locale {
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored !== null && isLocale(stored)) return stored
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US"
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "zh-CN",
  messages,
})

function applyLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
}

export function setLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  applyLocale(locale)
}

window.addEventListener("storage", (event) => {
  if (event.key !== LOCALE_STORAGE_KEY) return

  const stored = event.newValue
  applyLocale(stored !== null && isLocale(stored) ? stored : getInitialLocale())
})
