import { createHead } from "@unhead/vue/client"
import { createApp } from "vue"
import { createRouter, createWebHistory } from "vue-router"
import { DataLoaderPlugin } from "vue-router/experimental"

import App from "./app/App.vue"
import { clearAccessToken, readAccessToken } from "./app/auth.ts"
import { i18n } from "./app/i18n.ts"
import { ensureThemeReady } from "./app/theme.ts"
import { windbell } from "./app/windbell.ts"
import { routes } from "./pages/routes.ts"

import "./styles/index.css"

void bootstrap()

async function bootstrap(): Promise<void> {
  try {
    if (readAccessToken() === undefined) {
      renderAuthError()
      return
    }

    try {
      await windbell.health()
    } catch (error) {
      if (isUnauthorizedError(error)) {
        clearAccessToken()
        renderAuthError()
        return
      }

      throw error
    }

    const router = createRouter({
      history: createWebHistory(import.meta.env.BASE_URL),
      routes,
    })

    const app = createApp(App)

    // DataLoaderPlugin 必须在 router 之前注册。
    app.use(DataLoaderPlugin, { router })
    app.use(i18n)
    app.use(createHead())
    app.use(router)

    document.documentElement.lang = i18n.global.locale.value

    await Promise.all([router.isReady(), ensureThemeReady()])
    app.mount("#app")
  } catch (error) {
    renderBootError(error)
  }
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: unknown }).status === 401
  )
}

function renderAuthError(): void {
  const target = document.querySelector("#app")

  if (target === null) return

  const container = document.createElement("main")
  const title = document.createElement("h1")
  const detail = document.createElement("p")

  title.textContent = "Windbell access token is missing or invalid"
  detail.textContent =
    "Run `windbell start` again and open the URL printed in the terminal."

  container.append(title, detail)
  target.replaceChildren(container)
}

function renderBootError(error: unknown): void {
  const target = document.querySelector("#app")

  if (target === null) return

  const message = error instanceof Error ? error.message : String(error)
  const container = document.createElement("main")
  const title = document.createElement("h1")
  const detail = document.createElement("p")

  title.textContent = "Windbell failed to start"
  detail.textContent = message

  container.append(title, detail)
  target.replaceChildren(container)
}
