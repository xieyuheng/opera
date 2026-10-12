import { createHead } from "@unhead/vue/client"
import { createApp } from "vue"
import { createRouter, createWebHistory } from "vue-router"
import { DataLoaderPlugin } from "vue-router/experimental"
import App from "./app/App.vue"
import { i18n } from "./app/i18n.ts"
import { initSemiosis } from "./app/semiosis.ts"
import { ensureThemeReady } from "./app/theme.ts"
import { routes } from "./pages/routes.ts"
import "./styles/index.css"

void bootstrap()

async function bootstrap(): Promise<void> {
  try {
    await initSemiosis()

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
