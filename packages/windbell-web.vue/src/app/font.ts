import { reactive, watch } from "vue"

export type Font = "unifont" | "source-han-serif" | "source-han-sans" | "system"

const FONT_STORAGE_KEY = "windbell.font"

let syncingFromStorage = false

function isFont(value: string): value is Font {
  return (
    value === "unifont" ||
    value === "source-han-serif" ||
    value === "source-han-sans" ||
    value === "system"
  )
}

function getInitialFont(): Font {
  const stored = localStorage.getItem(FONT_STORAGE_KEY)
  return stored !== null && isFont(stored) ? stored : "system"
}

function fontFromStorage(value: string | null): Font | undefined {
  if (value === null) return "system"
  return isFont(value) ? value : undefined
}

function applyFont(font: Font): void {
  if (font === "system") {
    delete document.documentElement.dataset.font
    return
  }

  document.documentElement.dataset.font = font
}

const state = reactive({
  name: getInitialFont(),
  setFont(name: Font) {
    this.name = name
  },
})

watch(
  () => state.name,
  (name) => {
    if (!syncingFromStorage) {
      if (name === "system") {
        localStorage.removeItem(FONT_STORAGE_KEY)
      } else {
        localStorage.setItem(FONT_STORAGE_KEY, name)
      }
    }

    applyFont(name)
  },
  { immediate: true, flush: "sync" },
)

window.addEventListener("storage", (event) => {
  if (event.key !== FONT_STORAGE_KEY) return

  const font = fontFromStorage(event.newValue)
  if (font === undefined || font === state.name) return

  syncingFromStorage = true
  state.setFont(font)
  syncingFromStorage = false
})

export function useFont() {
  return state
}
